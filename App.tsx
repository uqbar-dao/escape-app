import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Button } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import useStore from "./hooks/useStore";
import Navigation from "./navigation";

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const { shipUrl, setShipUrl } = useStore();
  const [shipUrlInput, setShipUrlInput] = useState("");

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        {!shipUrl ? (
          <View>
            <Text>Welcome, please enter a ship url:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setShipUrlInput}
              value={shipUrlInput}
              placeholder="http://..."
            />
            <Button title="Save" onPress={() => setShipUrl(shipUrlInput)} />
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
});
