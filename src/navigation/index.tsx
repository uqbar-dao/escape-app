import React, { ComponentProps } from 'react';
import { ColorSchemeName, Platform, StyleSheet, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import NotFoundScreen from "../screens/NotFoundScreen";
import Escape from "../screens/Escape";
import {
  RootStackParamList,
  RootTabParamList,
  RootTabScreenProps,
} from "../../types";
import LinkingConfiguration from "./LinkingConfiguration";
import Grid from "../screens/Grid";
import Bitcoin from "../screens/Bitcoin";
import ShipsScreen from "../screens/ShipsScreen";
import ShipSelector from "../components/header/ShipSelector";
import GridSelector from "../components/header/GridSelector";
import Sigil from '../components/Sigil';

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
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EScape"
        component={Escape}
        options={({ navigation }) => ({
          headerLeft: () => <ShipSelector navigation={navigation} />,
          headerTitle: () => <View />,
          headerRight: () => <GridSelector navigation={navigation} />,
        })}
      />
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
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Escape"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarHideOnKeyboard: true,
      }}
    >
      <BottomTab.Screen
        name="Escape"
        component={Escape}
        options={({ navigation }: RootTabScreenProps<"Escape">) => ({
          tabBarItemStyle: { display: 'none' },
          headerLeft: () => <ShipSelector navigation={navigation} />,
          headerTitle: () => <View />,
          headerRight: () => <GridSelector navigation={navigation} />,
          tabBarIcon: ({ color }) => <TabBarIcon name="circle" color={color} />,
        })}
      />
      {/*<BottomTab.Screen
        name="Bitcoin"
        component={Bitcoin}
        options={({ navigation }: RootTabScreenProps<"Bitcoin">) => ({
          title: "Bitcoin",
          tabBarItemStyle: { paddingVertical: 4 },
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bitcoin" color={color} />
          ),
          headerRight: () => <ShipSelector navigation={navigation} />,
        })}
      />
      <BottomTab.Screen
        name="Grid"
        component={Grid}
        options={({ navigation }: RootTabScreenProps<"Grid">) => ({
          title: "Grid",
          tabBarItemStyle: { paddingVertical: 4 },
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="th-large" color={color} />
          ),
          headerRight: () => <ShipSelector navigation={navigation} />,
        })}
      />*/}
    </BottomTab.Navigator>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -4 }} {...props} />;
}

const styles = StyleSheet.create({
  drawerContainer: {
    width: '100%',
    padding: 24,
    paddingTop: 48
  },
  drawerScroll: {
    width: '100%',
  },
  shipEntry: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    
  },
  primaryShip: (dark: boolean) => ({
    fontSize: 16,
    fontWeight: '600',
    color: dark ? 'white' : 'black',
    borderBottomColor: dark ? 'white' : 'black',
    borderBottomWidth: 1
  }),
  secondaryShip: (dark: boolean) => ({
    fontSize: 16,
    fontWeight: '600',
    color: dark ? 'white' : 'black'
  }),
  changeShip: {
    padding: 8
  },
  changeShipText: (dark: boolean) => ({
    fontSize: 16,
    fontWeight: '700',
    color: dark ? 'white' : 'black',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 16,
  }),
});
