import React, { ComponentProps } from 'react';
import { ColorSchemeName, Image, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from '@expo/vector-icons/Ionicons';

import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import NotFoundScreen from "../screens/NotFoundScreen";
import Escape from "../screens/tabs/Escape";
import { Messages } from '../screens/tabs/Messages';
import { Notifications } from '../screens/tabs/Notifications';
import { RootStackParamList, RootTabParamList } from "../../types";
import LinkingConfiguration from "./LinkingConfiguration";
import ShipsScreen from "../screens/ShipsScreen";
import ShipSelector from "../components/header/ShipSelector";
import GridSelector from "../components/header/GridSelector";
import { DmResource } from '../screens/escape-routes/DmResource';
import { H4 } from '../components/html/Headers';
import useHarkState from '../state/useHarkState';
import { useDmUnreads } from '../hooks/useDmUnreads';
import { Row } from '../components/spacing/Row';
import { UnreadIndicator } from '../components/nav/UnreadIndicator';
import useStore from '../state/useStore';
import { NewDm } from '../screens/escape-routes/NewDm';
import { ChatResource } from '../screens/escape-routes/ChatResource';
import { useThemeWatcher } from '../hooks/useThemeWatcher';
import { useApi } from '../hooks/useApi';
import { ESCAPE_URL_REGEX } from '../constants/Webview';

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { theme } = useThemeWatcher();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.white },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={BottomTabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChatResource"
        component={ChatResource}
        options={({ navigation, route }) => ({
          headerTitle: () => <H4>{route?.params?.title || 'Group Message'}</H4>,
        })}
      />
      <Stack.Screen
        name="DmResource"
        component={DmResource}
        options={({ navigation, route }) => ({
          headerTitle: () => <H4>{route?.params?.ship || 'Message'}</H4>,
        })}
      />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="NewDm" component={NewDm} />
      </Stack.Group>
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="Ships" component={ShipsScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
  const { ship, webViewRef, getCurrentPath, setPath } = useStore();
  const { theme } = useThemeWatcher();
  const colorScheme = useColorScheme();
  const { notificationsCount } = useHarkState();
  const { unreadDmCount } = useDmUnreads();
  const { bootstrap } = useApi();
  const styles = getStyles(theme.colors);

  const refresh = () => {
    bootstrap();
    webViewRef?.current?.injectJavaScript('window.bootstrapApi(true)');
  };
  const showMenu = (navigation: any) => () => {
    navigation.navigate('Home');
    webViewRef?.current?.injectJavaScript('window.toggleOmnibox()');
  };
  const goHome = () => {
    if (!ESCAPE_URL_REGEX.test(getCurrentPath())) {
      setPath(ship, '/apps/escape/');
    } else {
      webViewRef?.current?.injectJavaScript('window.routeToHome()');
    }
  };

  return (
    <BottomTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        headerStyle: { backgroundColor: theme.colors.white },
      }}
    >
      <BottomTab.Screen
        name="Home"
        component={Escape}
        options={({ navigation, route }) => ({
          tabBarIcon: () => navigation.getState().index === 0 ? <TouchableOpacity onPress={goHome} style={{ padding: 16, paddingBottom: 12 }}>
            <Image style={styles.logo} source={require('../../assets/images/icon.png')} />
          </TouchableOpacity>
          : <Image style={styles.logo} source={require('../../assets/images/icon.png')} />,
          headerLeft: () => <ShipSelector navigation={navigation} />,
          headerTitle: () => <View />,
          headerRight: () => <GridSelector navigation={navigation} />,
          headerBackVisible: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
        })}
      />
      <BottomTab.Screen
        name="Messages"
        component={Messages}
        options={({ navigation }) => ({
          tabBarIcon: ({ color }) => <Row style={{ backgroundColor: theme.colors.white }}>
            <TabBarIcon name="chatbox-outline" color={theme.colors.black} />
            <UnreadIndicator unread={unreadDmCount} />
          </Row>,
          headerLeft: () => <ShipSelector navigation={navigation} />,
          headerTitle: () => <View />,
          headerRight: () => <GridSelector navigation={navigation} />,
          headerBackVisible: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
        })}
      />
      <BottomTab.Screen
        name="Notifications"
        component={Notifications}
        options={({ navigation }) => ({
          tabBarIcon: ({ color }) => <Row style={{ backgroundColor: theme.colors.white }}>
            <TabBarIcon name="file-tray-outline" color={theme.colors.black} />
            <UnreadIndicator unread={Math.max(0, notificationsCount - unreadDmCount)} />
          </Row>,
          headerLeft: () => <ShipSelector navigation={navigation} />,
          headerTitle: () => <View />,
          headerRight: () => <GridSelector navigation={navigation} />,
          headerBackVisible: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
        })}
      />
      <BottomTab.Screen
        name="Refresh"
        component={View}
        options={({ navigation, route }) => ({
          tabBarIcon: ({ color }) => <TouchableOpacity onPress={refresh} style={styles.button}>
            <TabBarIcon name="refresh-outline" color={theme.colors.black} />
          </TouchableOpacity>,
          headerBackVisible: false,
          tabBarShowLabel: false,
        })}
      />
      <BottomTab.Screen
        name="Menu"
        component={View}
        options={({ navigation }) => ({
          tabBarIcon: ({ color }) => <TouchableOpacity onPress={showMenu(navigation)} style={styles.button}>
            <TabBarIcon name="menu-outline" size={30} color={theme.colors.black} />
          </TouchableOpacity>,
          headerBackVisible: false,
          tabBarShowLabel: false,
        })}
      />
    </BottomTab.Navigator>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon({ size = 24, ...props }: {
  name: ComponentProps<typeof Ionicons>["name"];
  color: string;
  size?: number;
}) {
  return <Ionicons size={size} style={{ marginBottom: -4 }} {...props} />;
}

const getStyles = (colors: any) => StyleSheet.create({
  drawerContainer: {
    width: '100%',
    padding: 24,
    paddingTop: 48
  },
  drawerScroll: {
    width: '100%',
  },
  tabBar: {
    backgroundColor: colors.white,
    height: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: Platform.OS === 'ios' ? 24 : 4,
  },
  shipEntry: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    
  },
  primaryShip: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    borderBottomColor: colors.black,
    borderBottomWidth: 1
  },
  secondaryShip: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  changeShip: {
    padding: 8
  },
  changeShipText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 16,
  },
  logo: {
    height: 24,
    width: 24,
  },
  button: {
    padding: 16,
    paddingBottom: 20,
  },
});
