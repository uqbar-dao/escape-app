import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, BackHandler, Platform, SafeAreaView, StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";

interface WebviewProps {
  url: string;
  onMessage?: (event: WebViewMessageEvent) => void;
}

const Webview = ({ url, onMessage }: WebviewProps) => {
  const webView = useRef<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  const appState = useRef(AppState.currentState);

  const HandleBackPressed = useCallback(() => {
    if (webView.current) {
      webView.current?.goBack();
      return true; // PREVENT DEFAULT BEHAVIOUR (EXITING THE APP)
    }
    return false;
  }, [webView.current]);

  useEffect(() => {
    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", HandleBackPressed);
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        webView.current?.injectJavaScript('window.bootstrapApi(true)');
      }

      appState.current = nextAppState;
    }

    AppState.addEventListener("change", handleAppStateChange);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", HandleBackPressed);
      AppState.removeEventListener("change", handleAppStateChange);
    };
  }, []); // INITIALIZE ONLY ONCE

  useEffect(() => {
    setTimeout(() => setWebViewKey(webViewKey + 1), 10);
  }, [url]);

  const onNavStateChange = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
  }, [setCanGoBack]);

  const modifiedUrl = new URL(url);
  const mobileAppParams = new URLSearchParams(modifiedUrl.search);
  mobileAppParams.append('isMobileApp', 'true');
  modifiedUrl.search = mobileAppParams.toString();
  const uri = modifiedUrl.toString();

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        key={webViewKey}
        style={styles.webview}
        allowsBackForwardNavigationGestures
        scalesPageToFit
        sharedCookiesEnabled
        ref={webView}
        source={{ uri }}
        onNavigationStateChange={onNavStateChange}
        onMessage={onMessage}
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
