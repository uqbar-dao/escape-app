import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Button, Image, StyleSheet, TextInput, TouchableOpacity } from "react-native";

import { Text, View } from "../components/Themed";
import useStore from "../hooks/useStore";
import { PURPLE } from "../style/colors";
import { URBIT_HOME_REGEX } from "../util/regex";

const SHIP_COOKIE_REGEX = /(~)[a-z\-]+?(\=)/;
const getShipFromCookie = (cookie: string) => cookie.match(SHIP_COOKIE_REGEX)![0].slice(0, -1);

export default function LoginScreen() {
  const { ships, ship, shipUrl, authCookie, addShip, clearShip, setShipUrl, setShip } = useStore();
  const [shipUrlInput, setShipUrlInput] = useState('');
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [urlProblem, setUrlProblem] = useState<string | null>();
  const [loginProblem, setLoginProblem] = useState<string | null>();
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (shipUrl) {
      fetch(shipUrl)
        .then(async (response) => {
          const html = await response.text();

          if (URBIT_HOME_REGEX.test(html)) {
            const authCookieHeader = response.headers.get('set-cookie') || 'valid';
            if (typeof authCookieHeader === 'string' && authCookieHeader?.includes('urbauth-~')) {
              const ship = getShipFromCookie(authCookieHeader);
              addShip({ ship, shipUrl, authCookie: authCookieHeader, path: '/apps/escape/' });
            }
          } else {
            const stringMatch = html.match(/<input value="~.*?" disabled="true"/i) || [];
            const urbitId = stringMatch[0]?.slice(14, -17);
            if (urbitId) addShip({ ship: urbitId, shipUrl, path: '/apps/escape/' });
          }
        })
        .catch(console.error)
    }
  }, [shipUrl]);

  const changeUrl = useCallback(() => {
    clearShip();
  }, []);

  const handleSaveUrl = useCallback(async () => {
    setFormLoading(true);
    // const regExpPattern = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?$/i;
    const leadingHttpRegex = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/i;
    const noPrefixRegex = /^[A-Za-z0-9]+\.([\w#!:.?+=&%@!\-\/])+$/i;

    const prefixedUrl = noPrefixRegex.test(shipUrlInput) && !leadingHttpRegex.test(shipUrlInput) ? `https://${shipUrlInput}` : shipUrlInput;
    const formattedUrl = (prefixedUrl.endsWith("/") ? prefixedUrl.slice(0, prefixedUrl.length - 1) : prefixedUrl).replace('/apps/escape', '');

    if (!formattedUrl.match(leadingHttpRegex)) {
      setUrlProblem('Please enter a valid ship URL.');
    } else {
      let isValid = false;
      const response = await fetch(formattedUrl)
        .then((res) => {
          isValid = true;
          return res;
        })
        .catch(console.error);

      if (isValid) {
        setShipUrl(formattedUrl);

        const authCookieHeader = response?.headers.get('set-cookie') || 'valid';
        if (typeof authCookieHeader === 'string' && authCookieHeader?.includes('urbauth-~')) {
          // TODO: handle expired auth or determine if auth has already expired
          const ship = getShipFromCookie(authCookieHeader);
          addShip({ ship, shipUrl: formattedUrl, authCookie: authCookieHeader, path: '/apps/escape/' });
        } else {
          const html = await response?.text();
          if (html) {
            const stringMatch = html.match(/<input value="~.*?" disabled="true"/i) || [];
            const ship = stringMatch[0]?.slice(14, -17);
            if (ship) addShip({ ship, shipUrl: formattedUrl, path: '/apps/escape/' });
          }
        }
      } else {
        setUrlProblem('There was an error, please check the URL and try again.');
      }
    }
    setFormLoading(false);
  }, [shipUrlInput, addShip, setUrlProblem]);

  const handleLogin = useCallback(async () => {
    setFormLoading(true);
    const regExpPattern = /^((?:[a-z]{6}-){3}(?:[a-z]{6}))$/i;

    if (!accessKeyInput.match(regExpPattern)) {
      setLoginProblem('Please enter a valid access key.');
    } else {
      setLoginProblem(null);
      const formBody = `${encodeURIComponent('password')}=${encodeURIComponent(accessKeyInput)}`;
      
      await fetch(`${shipUrl}/~/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formBody
      })
        .then(async (response) => {
          const authCookieHeader = response.headers.get('set-cookie') || '';
          if (!authCookieHeader) {
            setLoginProblem('Please enter a valid access key.');
          } else {
            addShip({ ship, shipUrl, authCookie: authCookieHeader, path: '/apps/escape/' })
          }
        })
        .catch((err) => {
          console.warn('ERROR LOGGING IN')
        })
    }
    setFormLoading(false);
  }, [accessKeyInput, setLoginProblem]);

  if (formLoading) {
    return <View style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  }

  return (
    <View style={styles.shipInputView}>
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        <Image
          style={styles.logo}
          source={require('../../assets/images/icon.png')}
        />
        <Text style={styles.welcome}>Welcome to EScape by Uqbar</Text>
      </View>

      {!shipUrl ? (
        <>
          <Text style={styles.label}>
            Please enter the url to your urbit ship to log in:
          </Text>
          <TextInput
            style={styles.input}
            onChangeText={setShipUrlInput}
            value={shipUrlInput}
            placeholder="http(s)://your-ship.net"
            keyboardType="url"
          />
          {urlProblem && (
            <Text style={{ color: "red" }}>
              {urlProblem}
            </Text>
          )}
          <View style={{ height: 8 }} />
          <Button color={PURPLE} title="Continue" onPress={handleSaveUrl} />
        </>
      ) : (
        <>
          <Text style={styles.label}>
            Please enter your Access Key:
          </Text>
          <TextInput
            style={styles.input}
            value={ship}
            placeholder="sampel-palnet"
            editable={false}
          />
          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              onChangeText={setAccessKeyInput}
              value={accessKeyInput}
              placeholder="sampel-ticlyt-migfun-falmel"
              maxLength={27}
              secureTextEntry={!showPassword}
              keyboardType="visible-password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPassword}>
              <Text style={styles.showPasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {loginProblem && (
            <Text style={{ color: "red" }}>
              {loginProblem}
            </Text>
          )}
          <View style={{ height: 8 }} />
          <Button color={PURPLE} title="Continue" onPress={handleLogin} />
          <View style={{ height: 8 }} />
          <Button color={PURPLE} title="Log in with a different ID" onPress={changeUrl} />
        </>
      )}
      {(ships.length > 0 && !authCookie) && (
        <>
          <View style={{ height: 8 }} />
          <Button color={PURPLE} title="Cancel" onPress={() => setShip(ships[0].ship)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    height: 120,
    width: 120,
  },
  input: {
    height: 40,
    marginTop: 12,
    borderWidth: 1,
    padding: 10,
    backgroundColor: 'white'
  },
  shipInputView: {
    padding: 20,
    height: '100%'
  },
  welcome: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: "600",
  },
  label: {
    marginTop: 24,
  },
  showPassword: {
    padding: 4,
    position: 'absolute',
    right: 8,
    top: 18,
    color: 'gray',
  },
  showPasswordText: {
    color: 'black',
  },
});
