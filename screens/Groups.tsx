import * as React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import WebView from "react-native-webview";
import useStore from "../hooks/useStore";

export default function Groups() {
  const { shipUrl } = useStore();
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        style={styles.webview}
        source={{
          uri: `${shipUrl}/apps/landscape`,
        }}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
