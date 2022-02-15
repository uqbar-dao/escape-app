import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from 'expo-notifications';

import useCachedResources from "./src/hooks/useCachedResources";
import useColorScheme from "./src/hooks/useColorScheme";
import useStore from "./src/hooks/useStore";
import Navigation from "./src/navigation";
import LoginScreen from "./src/screens/Login";
import storage from "./src/util/storage";
import { URBIT_HOME_REGEX } from "./src/util/regex";

// TODO: move this somewhere else
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  // TODO: store this in local storage
  const { loading, setLoading, ship, shipUrl, loadStore } = useStore();
  const [needLogin, setNeedLogin] = useState(true);
  
  useEffect(() => {
    storage
      .load({ key: 'store' })
      .then((res) => {
        console.log(1, res)
        if (res?.shipUrl) {
          console.log(2)
          fetch(res.shipUrl)
            .then(async (response) => {
              const html = await response.text();
              console.log(3, html)

              if (URBIT_HOME_REGEX.test(html)) {
                console.log(4)
                loadStore(res);
                setNeedLogin(false);
              }
            })
            .catch(console.error)
        }
      })
      .catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 1000));
  }, []);

  if (!isLoadingComplete || loading) {
    return <View style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  }
  return (
    <SafeAreaProvider>
      {needLogin && !shipUrl && !ship ? (
        <LoginScreen />
      ) : (
        <Navigation colorScheme={colorScheme} />
      )}
      <StatusBar translucent />
    </SafeAreaProvider>
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
    fontWeight: '600',
  },
  welcome: {
    marginTop: 24,
  },
});
