import 'react-native-gesture-handler';
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Network from 'expo-network';
import { Ionicons } from "@expo/vector-icons";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import useStore from "./hooks/useStore";
import Navigation from "./navigation";
import LoginScreen from "./screens/Login";
import storage from "./util/storage";
import { URBIT_HOME_REGEX } from "./util/regex";
import { getNotificationData } from './util/notification';

const CLEAR_NOTIFICATIONS_BACKGROUND = 'CLEAR_NOTIFICATIONS_BACKGROUND';

TaskManager.defineTask(CLEAR_NOTIFICATIONS_BACKGROUND, ({ data, error, executionInfo }) => {
  const payload = data as any;
  console.log('Received a notification in the background!', data, error, executionInfo);
  // TODO: improve this to dismiss specific notifications. Unsure how to do this.
  if (payload.clearNotifications) {
    Notifications.dismissAllNotificationsAsync();
  }
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  }),
});

Notifications.registerTaskAsync(CLEAR_NOTIFICATIONS_BACKGROUND);

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const { loading, setLoading, escapeInstalled, ship, shipUrl, authCookie, loadStore, needLogin, setNeedLogin, setShip, setPath } = useStore();
  const isDark = colorScheme === 'dark';
  const [connected, setConnected] = useState(true)

  const checkNetwork = useCallback(async () => {
    const networkState = await Network.getNetworkStateAsync();
    setConnected(Boolean(networkState.isInternetReachable))
  }, [setConnected]);
  
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
    checkNetwork();

    Notifications.setBadgeCountAsync(0);

    const subscription = Notifications.addNotificationResponseReceivedListener(notificationResponse => {
      const { redirect, targetShip } = getNotificationData(notificationResponse?.notification);
      if (redirect && targetShip) {
        if (targetShip !== ship) {
          setShip(targetShip);
        }
        setPath(targetShip, `/apps/escape/`);
        setPath(targetShip, `/apps/escape${redirect}`);
      }
    });

    return subscription.remove;
  }, []);

  const backgroundColor = isDark ? 'black' : 'white';
  const loaderColor = isDark ? 'white' : 'black';

  if (!connected) {
    return (
      <View
        style={{
          backgroundColor,
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="cloud-offline-outline" size={40} color={loaderColor} />
        <Text style={{ color: loaderColor, padding: 32, lineHeight: 20, textAlign: 'center' }}>
          You are offline, {'\n'}please check your connection and then refresh.
        </Text>
        <Button title="Retry Connection" onPress={checkNetwork} />
      </View>
    );
  }

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
