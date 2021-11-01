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
  const [urlProblem, setUrlProblem] = useState(false);

  useEffect(() => {
    storage
      .load({ key: "shipUrl" })
      .then((res) => setShipUrl(res))
      .catch((err) => console.log(err));
  }, []);

  const handleSave = (url: string) => {
    const regExpPattern = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?$/i;

    if (
      url.endsWith("/") &&
      url.slice(0, url.length - 1).match(regExpPattern)
    ) {
      setShipUrl(url.slice(0, url.length - 1));
      storage.save({ key: "shipUrl", data: url.slice(0, url.length - 1) });
    } else if (url.match(regExpPattern)) {
      setShipUrl(url);
      storage.save({ key: "shipUrl", data: url });
    } else {
      setUrlProblem(true);
    }
  };

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        {!shipUrl ? (
          <View style={styles.shipInputView}>
            <View style={{ alignItems: "center", marginTop: 24 }}>
              <Text style={styles.title}>UrLand</Text>
            </View>
            <Text style={styles.welcome}>
              Welcome, please enter a ship url:
            </Text>
            <TextInput
              style={styles.input}
              onChangeText={setShipUrlInput}
              value={shipUrlInput}
              placeholder="http://..."
            />
            {urlProblem && (
              <Text style={{ color: "red" }}>
                Please enter a valid ship URL.
              </Text>
            )}
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
  },
  title: {
    fontSize: 36,
    fontWeight: "600",
  },
  welcome: {
    marginTop: 24,
  },
});
