import React, { useState, useEffect } from "react";
import { scheduleNotificationAsync } from "expo-notifications";
import { WebViewMessageEvent } from "react-native-webview";
import * as Notifications from 'expo-notifications';

import useStore, { ShipConnection } from "../hooks/useStore";
import Webview from "../components/WebView";
import { AppState, AppStateStatus, StyleSheet, View } from "react-native";
import { getNotificationData, getPushNotificationToken } from "../util/notification";
import { deSig } from "../util/string";

interface EscapeWindowProps {
  shipConnection: ShipConnection;
  pushNotificationsToken: string;
  androidHardwareAccelerationDisabled?: boolean;
}

function EscapeWindow({
  shipConnection,
  pushNotificationsToken,
  androidHardwareAccelerationDisabled = false
}: EscapeWindowProps) {
  const { ship: selectedShip, setShip, removeShip, setPath, setCurrentPath } = useStore();
  const { ship, shipUrl, path, currentPath } = shipConnection;

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        setCurrentPath(ship, '/');
      }
    }

    AppState.addEventListener("change", handleAppStateChange);
  }, []);

  const onMessage = (event: WebViewMessageEvent) => {
    const { type, body, pathname, redirect } = JSON.parse(event.nativeEvent.data);

    if (type === 'hark-notification') {
      const [redirectBaseUrl] = redirect?.split('?');
      if (redirectBaseUrl === currentPath) {
        return;
      }

      const { title, content } = body;
      const displayTitle = title.map((part: any) => Object.values(part).join('')).join('');
      const displayBody = content.map(({ text, ship }: any) => text || ship || '').join('');

      scheduleNotificationAsync({
        content: {
          title: displayTitle,
          body: displayBody,
          data: { redirect },
        },
        trigger: { seconds: 1 }
      });
    } else if (type === 'navigation-change') {
      setCurrentPath(ship, pathname);
    } else if (type === 'logout') {
      removeShip(ship);
    }
  };

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const { redirect, targetShip } = getNotificationData(notification);

        if (deSig(targetShip) === deSig(selectedShip) && currentPath && redirect.includes(currentPath)) {
          return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
        }

        return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true };
      },
    });
  }, [currentPath, selectedShip]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(notificationResponse => {
      const { redirect, targetShip } = getNotificationData(notificationResponse?.notification);
      if (redirect && targetShip) {
        if (targetShip !== ship) {
          setShip(targetShip);
        } else {
          setPath(ship, `/apps/escape${redirect}`);
        }
      }
    });
    return subscription.remove;
  }, []);

  const url = `${shipUrl}${path || '/apps/escape/'}`.toLowerCase();
  
  return <Webview {...{ url, onMessage, androidHardwareAccelerationDisabled, pushNotificationsToken, ship }} />;
}

export default function Escape() {
  const { ship, shipUrl, authCookie, ships } = useStore();
  const [token, setToken] = useState('');

  useEffect(() => {
    getPushNotificationToken()
      .then((token) => {
        if (token) {
          setToken(token);
        }
      })
      .catch(console.error);
  }, []);

  const sortedShips = ships.sort((a, b) => {
    if (a.ship === ship) {
      return -1;
    } else if (b.ship === ship) {
      return 1;
    } else {
      return 0;
    }
  });

  return <>
    {ships.map((s) => <View key={s.ship} style={s.ship === ship ? styles.primary : {}}>
      <EscapeWindow shipConnection={s} pushNotificationsToken={token} androidHardwareAccelerationDisabled={s.ship !== ship} />
    </View>)}
  </>;
}

const styles = StyleSheet.create({
  primary: {
    width: '100%',
    height: '100%',
  },
});
