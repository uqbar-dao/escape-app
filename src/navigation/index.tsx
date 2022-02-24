import React, { ComponentProps } from 'react';
import { FontAwesome } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ColorSchemeName } from "react-native";

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
import HeaderBar from "../components/HeaderBar";
import SettingsScreen from "../screens/SettingsScreen";

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
          title: "EScape",
          headerRight: () => <HeaderBar navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="Settings" component={SettingsScreen} />
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

  // TODO: once the mobile nav scheme is worked out, replace this
  // return <Escape />;

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
          title: "EScape",
          tabBarItemStyle: { display: 'none' },
          tabBarIcon: ({ color }) => <TabBarIcon name="circle" color={color} />,
          headerRight: () => <HeaderBar navigation={navigation} />,
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
          headerRight: () => <HeaderBar navigation={navigation} />,
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
          headerRight: () => <HeaderBar navigation={navigation} />,
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
