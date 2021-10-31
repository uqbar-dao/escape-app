import React, { useState, useEffect, useRef } from "react";
import { BackHandler, Platform, SafeAreaView, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const Webview = ({ url }: { url: string }) => {
  const webView = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", HandleBackPressed);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", HandleBackPressed);
      };
    }
  }, []); // INITIALIZE ONLY ONCE

  const HandleBackPressed = () => {
    if (webView.current) {
      webView.current.goBack();
      return true; // PREVENT DEFAULT BEHAVIOUR (EXITING THE APP)
    }
    return false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        style={styles.webview}
        allowsBackForwardNavigationGestures
        scalesPageToFit
        ref={webView}
        source={{
          uri: url,
        }}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default Webview;
