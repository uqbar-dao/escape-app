/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  // EScape routes
  ChatResource: { path: string, title?: string };
  DmResource: { ship: string };
  NewDm: undefined;
  // Ancillary routes
  Modal: undefined;
  Ships: undefined;
  NotFound: undefined;
};

export type MessagesStackParamList = {
  Messages: NavigatorScreenParams<RootTabParamList> | undefined;
  MessageChat: NavigatorScreenParams<RootTabParamList> | undefined;
};

export type RootStackScreenProps<
  Screen extends keyof RootStackParamList
> = NativeStackScreenProps<RootStackParamList, Screen>;

export type RootTabParamList = {
  Home: undefined;
  Messages: undefined;
  Notifications: undefined;
  Refresh: undefined;
  Menu: undefined;
};

export type RootTabScreenProps<
  Screen extends keyof RootTabParamList
> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;
