import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Button } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import useStore from "./hooks/useStore";
import Navigation from "./navigation";
import storage from "./util/storage";

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const { shipUrl, setShipUrl } = useStore();
  const [shipUrlInput, setShipUrlInput] = useState("");

  useEffect(() => {
    storage
      .load({ key: "shipUrl" })
      .then((res) => setShipUrl(res))
      .catch((err) => console.log(err));
  }, []);

  const handleSave = (url: string) => {
    setShipUrl(url);
    storage.save({ key: "shipUrl", data: url });
  };

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        {!shipUrl ? (
          <View style={styles.shipInputView}>
            <Text style={styles.title}>UrLand</Text>
            <Text style={styles.welcome}>
              Welcome, please enter a ship url:
            </Text>
            <TextInput
              style={styles.input}
              onChangeText={setShipUrlInput}
              value={shipUrlInput}
              placeholder="http://..."
            />
            <Button title="Save" onPress={() => handleSave(shipUrlInput)} />
          </View>
        ) : (
          <Navigation colorScheme={colorScheme} />
        )}
        <StatusBar translucent={false} />
      </SafeAreaProvider>
    );
  }
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  shipInputView: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "600",
  },
  welcome: {
    marginTop: 24,
  },
});
