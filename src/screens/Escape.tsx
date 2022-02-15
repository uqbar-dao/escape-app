import React, { useState, useEffect } from "react";
import { scheduleNotificationAsync } from "expo-notifications";
import { WebViewMessageEvent } from "react-native-webview";
import * as Notifications from 'expo-notifications';

import useStore, { ShipConnection } from "../hooks/useStore";
import Webview from "../components/WebView";

function EscapeWindow({ shipConnection }: { shipConnection: ShipConnection }) {
  const { ship, setShip } = useStore();
  const { shipUrl } = shipConnection;
  const [url, setUrl] = useState(`${shipUrl}/apps/escape/`);
  const [currentPath, setCurrentPath] = useState('/');

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
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(notification => {
      const redirect = notification?.notification?.request?.content?.data?.redirect;
      if (redirect) {
        if (ship !== shipConnection.ship) {
          setShip(ship);
        }
        setUrl(`${shipUrl}/apps/escape${redirect}`);
      }
    });
    return () => subscription.remove();
  }, []);
  
  return <Webview {...{ url, onMessage }} />;
}

export default function Escape() {
  const { ship, shipUrl, authCookie, ships, setShip } = useStore();
  
  const backgroundShips = ships.filter((s) => s.ship !== ship);
  // - Display them as a stack of elements
  // - The first one should be the currently selected one
  // - Pass ship as a prop to EScape
  // - Selecting a notification should select the ship

  return <>
    {backgroundShips.map((s) => <EscapeWindow shipConnection={s} key={s.ship} />)}
    <EscapeWindow shipConnection={{ ship, shipUrl, authCookie }} />
  </>;
}
