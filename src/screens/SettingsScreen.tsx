import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Alert, Button, Platform, Pressable, StyleSheet } from "react-native";

import { Text, View } from "../components/Themed";
import useStore from "../hooks/useStore";
import { RootStackScreenProps } from "../../types";
import { PURPLE } from "../style/colors";

export default function SettingsScreen({
  navigation,
}: RootStackScreenProps<"Settings">) {
  const { ships, ship, setShip, removeShip, removeAllShips, setNeedLogin } = useStore();
  const shipList = Object.values(ships);

  const handleAdd = () => {
    setShip('none');
    setNeedLogin(true);
  };

  const handleClear = () => {
    removeAllShips();
    setNeedLogin(true);
    navigation.goBack();
  };

  const showClearAlert = () =>
  Alert.alert(
    "Clear All Ships",
    "Are you sure you want to clear all ship info?",
    [
      {
        text: "No",
        onPress: () => null,
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: handleClear,
        style: "default",
      },
    ],
    {
      cancelable: true,
      onDismiss: () =>
        Alert.alert(
          "This alert was dismissed by tapping outside of the alert dialog."
        ),
    }
  );

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        {shipList.map((s) => <View key={s.ship} style={styles.shipRow}>
          <Text>{s.ship}</Text>
          <View style={styles.row}>
            {ship === s.ship ? (
              <Text style={{ height: 32, textAlignVertical: 'center' }}>Current</Text>
            ) : (
              <Button title="Select" color={PURPLE} onPress={() => setShip(s.ship)} />
            )}
            <View style={{ width: 24 }} />
            <Button title="Remove" color={PURPLE} onPress={() => removeShip(s.ship)} />
          </View>
        </View>)}
      </View>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Button title="Add ship" color={PURPLE} onPress={handleAdd} />
      <View style={{ height: 24 }} />
      <Button title="Clear all ships" color={PURPLE} onPress={showClearAlert} />

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
  column: {
    display: 'flex',
    flexDirection: 'column',
    width: '80%',
  },
  shipRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
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
