import { FontAwesome } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { ColorSchemeName, Pressable, View } from "react-native";

import Colors from "../constants/Colors";
import useColorScheme from "../hooks/useColorScheme";
import NotFoundScreen from "../screens/NotFoundScreen";
import Groups from "../screens/Groups";
import {
  RootStackParamList,
  RootTabParamList,
  RootTabScreenProps,
} from "../types";
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
        name="Root"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
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

  return (
    <BottomTab.Navigator
      initialRouteName="Grid"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
      }}
    >
      <BottomTab.Screen
        name="Groups"
        component={Groups}
        options={({ navigation }: RootTabScreenProps<"Groups">) => ({
          title: "Groups",
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          headerRight: () => <HeaderBar navigation={navigation} />,
        })}
      />
      <BottomTab.Screen
        name="Bitcoin"
        component={Bitcoin}
        options={({ navigation }: RootTabScreenProps<"Bitcoin">) => ({
          title: "Bitcoin",
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
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="th-large" color={color} />
          ),
          headerRight: () => <HeaderBar navigation={navigation} />,
        })}
      />
    </BottomTab.Navigator>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}
