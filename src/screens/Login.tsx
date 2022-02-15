import React, { useCallback, useEffect, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import { Text, View } from "../components/Themed";
import useStore from "../hooks/useStore";
import { URBIT_HOME_REGEX } from "../util/regex";

const SHIP_COOKIE_REGEX = /(~)[a-z\-]+?(\=)/;
const getShipFromCookie = (cookie: string) => cookie.match(SHIP_COOKIE_REGEX)![0].slice(1, -1);

export default function LoginScreen() {
  const { ship, shipUrl, addShip, setLoading, clearShip, setShipUrl } = useStore();
  const [shipUrlInput, setShipUrlInput] = useState("");
  const [accessKeyInput, setAccessKeyInput] = useState("");
  const [urlProblem, setUrlProblem] = useState<string | null>();
  const [loginProblem, setLoginProblem] = useState<string | null>();
  const [text, setText] = useState('~fabnev-hinmur='.slice(1, -1));

  useEffect(() => {
    if (shipUrl) {
      setText(shipUrl)
      fetch(shipUrl)
        .then(async (response) => {
          const html = await response.text();

          if (URBIT_HOME_REGEX.test(html)) {
            const authCookieHeader = response.headers.get('set-cookie') || 'valid';
            if (typeof authCookieHeader === 'string' && authCookieHeader?.includes('urbauth-~')) {
              const ship = getShipFromCookie(authCookieHeader);
              addShip({ ship, shipUrl, authCookie: authCookieHeader });
            }
          } else {
            const stringMatch = html.match(/<input value="~.*?" disabled="true"/i) || [];
            const urbitId = stringMatch[0]?.slice(14, -17);
            if (urbitId) addShip({ ship: urbitId, shipUrl });
          }
        })
        .catch(console.error)
    }
  }, [shipUrl]);

  const changeUrl = useCallback(() => {
    clearShip();
  }, []);

  const handleSaveUrl = useCallback(async () => {
    setLoading(true);
    const regExpPattern = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?$/i;

    const formattedUrl = (shipUrlInput.endsWith("/") ? shipUrlInput.slice(0, shipUrlInput.length - 1) : shipUrlInput).replace('/apps/escape', '');

    if (!formattedUrl.match(regExpPattern)) {
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
          addShip({ ship, shipUrl: formattedUrl, authCookie: authCookieHeader });
        } else {
          const html = await response?.text();
          if (html) {
            const stringMatch = html.match(/<input value="~.*?" disabled="true"/i) || [];
            const ship = stringMatch[0]?.slice(14, -17);
            if (ship) addShip({ ship, shipUrl });
          }
        }
      } else {
        setUrlProblem('There was an error, please check the URL and try again.');
      }
    }
    setLoading(false);
  }, [shipUrlInput, addShip, setUrlProblem]);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    const regExpPattern = /^((?:[a-z]{6}-){3}(?:[a-z]{6}))$/i;

    if (!accessKeyInput.match(regExpPattern)) {
      setLoginProblem('Please enter a valid access key.');
    } else {
      setLoginProblem(null);
      const formBody = `${encodeURIComponent('password')}=${encodeURIComponent(accessKeyInput)}`;
      
      fetch(`${shipUrl}/~/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formBody
      })
        .then(response => {
          const authCookieHeader = response.headers.get('set-cookie') || 'valid';
          addShip({ ship, shipUrl, authCookie: authCookieHeader })
        })
        .catch(console.error)
    }
    setLoading(false);
  }, [shipUrl, accessKeyInput, setLoginProblem]);

  return (
    <View style={styles.shipInputView}>
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <Text style={styles.title}>EScape</Text>
      </View>
      {!shipUrl ? (
        <>
          <Text style={styles.welcome}>
            Welcome, please enter a ship url:
          </Text>
          <TextInput
            style={styles.input}
            onChangeText={setShipUrlInput}
            value={shipUrlInput}
            placeholder="http(s)://..."
          />
          {urlProblem && (
            <Text style={{ color: "red" }}>
              {urlProblem}
            </Text>
          )}
          <Button color="black" title="Continue" onPress={handleSaveUrl} />
        </>
      ) : (
        <>
          <Text style={styles.welcome}>
            Please enter your Access Key:
          </Text>
          <TextInput
            style={styles.input}
            value={ship}
            placeholder="sampel-palnet"
            editable={false}
          />
          <TextInput
            style={styles.input}
            onChangeText={setAccessKeyInput}
            value={accessKeyInput}
            placeholder="sampel-ticlyt-migfun-falmel"
            maxLength={27}
            secureTextEntry
          />
          {loginProblem && (
            <Text style={{ color: "red" }}>
              {loginProblem}
            </Text>
          )}
          <Button color="black"  title="Continue" onPress={handleLogin} />
          <View style={{ marginTop: 8 }} />
          <Button color="black" title="Log in with a different ID" onPress={changeUrl} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  shipInputView: {
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "600",
  },
  welcome: {
    marginTop: 24,
  },
});
