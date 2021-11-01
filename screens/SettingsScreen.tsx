import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Button, Platform, StyleSheet } from "react-native";

import { Text, View } from "../components/Themed";
import useStore from "../hooks/useStore";
import { RootStackScreenProps } from "../types";
import storage from "../util/storage";

export default function SettingsScreen({
  navigation,
}: RootStackScreenProps<"Settings">) {
  const { setShipUrl } = useStore();

  const handleClear = () => {
    setShipUrl("");
    storage.save({ key: "shipUrl", data: "" });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Button title="Reset ship URL" onPress={() => handleClear()} />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
