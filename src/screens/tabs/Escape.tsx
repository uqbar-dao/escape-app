import React, { useState, useEffect, useRef } from "react";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import * as Notifications from 'expo-notifications';

import useStore from "../../state/useStore";
import Webview from "../../components/WebView";
import { getNotificationData, getPushNotificationToken } from "../../util/notification";
import { deSig, samePath } from "../../util/string";
import { useNav } from "../../hooks/useNav";

export default function Escape({ navigation }: any) {
  const ref = useRef<WebView>(null);
  const { ship: selectedShip, ships, setShip, removeShip, setCurrentPath, setPath, setWebViewRef } = useStore();
  const { ship, shipUrl, path, currentPath } = ships.find(s => s.ship === selectedShip)! || {};
  const [token, setToken] = useState('');
  const { navigate } = useNav(navigation);

  if (!ship) {
    return null;
  }

  useEffect(() => {
    getPushNotificationToken()
      .then((token) => {
        if (token) {
          setToken(token);
        }
      })
      .catch(console.error);
  }, []);

  const onMessage = (event: WebViewMessageEvent) => {
    const { type, pathname } = JSON.parse(event.nativeEvent.data);

    const resetWebview = () => setTimeout(() => {
      setPath(ship, '/apps/escape/~landscape');
      setPath(ship, currentPath || '/apps/escape/');
    }, 500);

    if (type === 'navigation-change') {
      if (pathname.includes('/~notifications')) {
        navigation.navigate('Tabs', { screen: 'Notifications' });
        resetWebview();
      } else if (pathname.includes('/~landscape/messages')) {
        navigation.navigate('Tabs', { screen: 'Messages' });
        resetWebview();
      } else {
        setCurrentPath(ship, `/apps/escape${pathname}`);
      }
    } else if (type === 'logout') {
      removeShip(ship);
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(({ notification }) => {
      const { redirect, targetShip } = getNotificationData(notification);
      if (redirect && targetShip) {
        if (targetShip !== ship) {
          setShip(targetShip);
        }

        setTimeout(() => navigate(redirect), 10)
      }
    });

    return subscription.remove;
  }, []);

  useEffect(() => {
    // const unsubscribe = navigation.addListener('focus', () => {
    //   ref?.current?.injectJavaScript('window.bootstrapApi(true)');
    // });

    // return unsubscribe;
    if (ref) {
      setWebViewRef(ref);
    }

  }, [ref]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const { redirect, targetShip, clearNotifications } = getNotificationData(notification);

        if ((deSig(targetShip) === deSig(selectedShip) && samePath(`/apps/escape${redirect}`, currentPath)) || clearNotifications) {
          if (clearNotifications) {
            Notifications.dismissAllNotificationsAsync();
          }
          return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
        }

        return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true };
      },
    });
  }, [currentPath, selectedShip]);

  const url = `${shipUrl}${path || '/apps/escape/'}`.toLowerCase();
  
  return <Webview {...{ ref, url, shipUrl, onMessage, pushNotificationsToken: token, ship, navigation }} />;
}
