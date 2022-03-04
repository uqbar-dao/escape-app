import 'react-native-gesture-handler';
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from 'expo-notifications';

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import useStore from "./hooks/useStore";
import Navigation from "./navigation";
import LoginScreen from "./screens/Login";
import storage from "./util/storage";
import { URBIT_HOME_REGEX } from "./util/regex";

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
  const { loading, setLoading, escapeInstalled, ship, shipUrl, authCookie, loadStore, needLogin, setNeedLogin } = useStore();
  const isDark = colorScheme === 'dark';
  
  useEffect(() => {
    const loadStorage = async () => {
      const res = await storage.load({ key: 'store' }).catch(console.error);
      if (res?.shipUrl) {
        const response = await fetch(res.shipUrl).catch(console.error);
        const html = await response?.text();

        if (html && URBIT_HOME_REGEX.test(html)) {
          loadStore(res);
          setNeedLogin(false);
        }
      }
      
      setTimeout(() => setLoading(false), 500)
    }
    loadStorage();
  }, []);

  const backgroundColor = isDark ? 'black' : 'white';
  const loaderColor = isDark ? 'white' : 'black';

  return (
    <SafeAreaProvider style={{ backgroundColor, height: '100%', width: '100%' }}>
      {(needLogin && (!shipUrl || !ship || !authCookie)) ? (
        <LoginScreen />
      ) : (
        <Navigation colorScheme={colorScheme} />
      )}
      <StatusBar translucent />
      {(!isLoadingComplete || loading) && (
        <View style={{ ...styles.loadingOverlay, backgroundColor }}>
          <ActivityIndicator size="large" color={loaderColor} />
        </View>
      )}
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
  loadingOverlay: {
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }
});
