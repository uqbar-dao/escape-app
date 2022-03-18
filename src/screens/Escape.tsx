import React, { useState, useEffect } from "react";
import { WebViewMessageEvent } from "react-native-webview";
import * as Notifications from 'expo-notifications';

import useStore, { ShipConnection } from "../hooks/useStore";
import Webview from "../components/WebView";
import { StyleSheet, View } from "react-native";
import { getNotificationData, getPushNotificationToken } from "../util/notification";
import { deSig, samePath } from "../util/string";

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

  const onMessage = (event: WebViewMessageEvent) => {
    const { type, pathname } = JSON.parse(event.nativeEvent.data);

    if (type === 'navigation-change') {
      setCurrentPath(ship, `/apps/escape${pathname}`);
    } else if (type === 'logout') {
      removeShip(ship);
    }
  };

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const { redirect, targetShip } = getNotificationData(notification);

        if (deSig(targetShip) === deSig(selectedShip) && samePath(`/apps/escape${redirect}`, currentPath)) {
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
  
  return <Webview {...{ url, shipUrl, onMessage, androidHardwareAccelerationDisabled, pushNotificationsToken, ship }} />;
}

export default function Escape() {
  const { ship, ships } = useStore();
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
