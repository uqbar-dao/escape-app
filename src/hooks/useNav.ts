import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import useStore from "../state/useStore";
import { getNotificationRedirect } from "../util/notificationRedirects";

export const useNav = () => {
  const { ship, setPath, setCurrentPath } = useStore();
  const navigation = useNavigation();

  const navigate = useCallback((url: string | { search: string }, title?: string) => {
    if (typeof url === 'string') {
      setCurrentPath(ship, url);
      if (url.includes('/~landscape/messages/dm')) {
        const [, , , , dmShip] = url.split('/');
        navigation.navigate('DmResource', { ship: dmShip });
      } else if (url.includes('/~landscape/messages/resource')) {
        navigation.navigate('ChatResource', { title, path: url });
      } else if (url.includes('/~landscape/messages/pending')) {
        const path = `/apps/escape/?join-kind=graph&join-path=/ship/${url.split('/').slice(-2).join('/')}`
        setPath(ship, path)
        navigation.navigate('Tabs', { screen: 'Home' });
      } else if (url.includes('/~landscape/messages')) {
        navigation.navigate('Tabs', { screen: 'Messages' });
      } else {
        navigation.navigate('Tabs', { screen: 'Home' });
        setPath(ship, `/apps/escape/`);
        setPath(ship, `/apps/escape${url}`);
      }
    } else {
      navigation.navigate('Tabs', { screen: 'Home' });
      setPath(ship, `/apps/escape/${url.search}`);
    }

  }, [ship, navigation, setPath, setCurrentPath]);

  return { navigate };
}
