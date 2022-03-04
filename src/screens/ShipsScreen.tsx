import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { Alert, Button, Platform, Pressable, ScrollView, StyleSheet, useColorScheme } from "react-native";

import { Text, View } from "../components/Themed";
import useStore from "../hooks/useStore";
import { RootStackScreenProps } from "../../types";
import { PURPLE } from "../style/colors";

export default function ShipsScreen({
  navigation,
}: RootStackScreenProps<"Ships">) {
  const { ships, ship, setShip, removeShip, removeAllShips, setNeedLogin } = useStore();
  const colorScheme = useColorScheme();
  const backgroundShips = ships.filter((s) => s.ship !== ship);

  const handleAdd = () => {
    setShip('none');
    setNeedLogin(true);
  };

  const handleClear = () => {
    removeAllShips();
    setNeedLogin(true);
    navigation.goBack();
  };

  const showClearAlert = () => Alert.alert(
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

  const selectShip = useCallback((ship: string) => () => {
    setShip(ship);
  }, [setShip]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.drawerScroll}>
        <View style={styles.shipEntry}>
          {/* <Sigil ship={ship} /> */}
          <Text style={styles.primaryShip(colorScheme === 'dark')}>{ship}</Text>
        </View>
        {backgroundShips.map(({ ship }) => <View style={styles.row} key={ship}>
          <Pressable key={ship} onPress={selectShip(ship)}>
            <View style={styles.shipEntry}>
              {/* <Sigil ship={ship} /> */}
              <Text style={styles.secondaryShip(colorScheme === 'dark')}>
                {ship}
              </Text>
            </View>
          </Pressable>
          <Button title="Remove" color={PURPLE} onPress={() => removeShip(s.ship)} />
        </View>)}
      </ScrollView>
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
    width: '100%',
    height: '100%',
    padding: 24,
    paddingTop: 48
  },
  drawerScroll: {
    width: '100%',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  shipEntry: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
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
});
