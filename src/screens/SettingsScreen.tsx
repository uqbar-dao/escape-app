import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Button, Platform, Pressable, StyleSheet } from "react-native";

import { Text, View } from "../components/Themed";
import useStore from "../hooks/useStore";
import { RootStackScreenProps } from "../../types";

export default function SettingsScreen({
  navigation,
}: RootStackScreenProps<"Settings">) {
  const { ships, ship, setShip, removeShip } = useStore();
  const shipList = Object.values(ships);

  const handleClear = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        {shipList.map((s) => <View key={s.ship} style={styles.shipRow}>
          <Text>{s.ship}</Text>
          <View style={styles.row}>
            {ship === s.ship ? (
              <Text style={{ height: 32, textAlignVertical: 'center' }}>Current</Text>
            ) : (
              <Button title="Select" color="black" onPress={() => setShip(s.ship)} />
            )}
            <View style={{ width: 24 }} />
            <Button title="Remove" color="black" onPress={() => removeShip(s.ship)} />
          </View>
        </View>)}
      </View>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Button title="Clear all ships" color="black" onPress={() => handleClear()} />

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
