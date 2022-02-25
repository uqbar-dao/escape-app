import React, { useState, useEffect } from "react";
import { scheduleNotificationAsync } from "expo-notifications";
import { WebViewMessageEvent } from "react-native-webview";
import * as Notifications from 'expo-notifications';

import useStore, { ShipConnection } from "../hooks/useStore";
import Webview from "../components/WebView";
import { AppState, AppStateStatus, View } from "react-native";
import { getPushNotificationToken } from "../util/notification";

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
  const { ship, setShip, removeShip } = useStore();
  const { shipUrl } = shipConnection;
  const [url, setUrl] = useState(`${shipUrl}/apps/escape/`);
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        setCurrentPath('/');
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
      setCurrentPath(pathname);
    } else if (type === 'logout') {
      removeShip(shipConnection.ship);
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(notification => {
      console.log('GOT NOTIFICATION', JSON.stringify(notification))
      const redirect = notification?.notification?.request?.content?.data?.redirect as string;
      const ship = notification?.notification?.request?.content?.data?.ship as string;
      if (redirect && ship) {
        if (ship !== shipConnection.ship) {
          setShip(ship);
        }
        setUrl(`${shipUrl}/apps/escape${redirect}`);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!url.includes(shipConnection.shipUrl)) {
      setUrl(`${shipConnection.shipUrl}/apps/escape/`)
    }
  }, [shipConnection]);
  
  return <Webview {...{ url, onMessage, androidHardwareAccelerationDisabled, pushNotificationsToken }} />;
}

export default function Escape() {
  const { ship, shipUrl, authCookie, ships, setShip } = useStore();
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

  const backgroundShips = ships.filter((s) => s.ship !== ship);
  
  return <>
    {backgroundShips.map((s) => <View key={s.ship} >
      <EscapeWindow shipConnection={s} pushNotificationsToken={token} androidHardwareAccelerationDisabled />
    </View>)}
    <EscapeWindow shipConnection={{ ship, shipUrl, authCookie }} pushNotificationsToken={token} />
  </>;
}
