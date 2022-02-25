import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, BackHandler, Platform, SafeAreaView, StyleSheet, useColorScheme } from "react-native";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { WebViewErrorEvent, WebViewHttpErrorEvent } from "react-native-webview/lib/WebViewTypes";
import useStore from "../hooks/useStore";

interface WebviewProps {
  url: string;
  pushNotificationsToken: string;
  onMessage?: (event: WebViewMessageEvent) => void;
  androidHardwareAccelerationDisabled?: boolean;
}

const Webview = ({
  url,
  pushNotificationsToken,
  onMessage,
  androidHardwareAccelerationDisabled = false
}: WebviewProps) => {
  const webView = useRef<any>(null);
  const colorScheme = useColorScheme();
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const { setEscapeInstalled } = useStore();

  const appState = useRef(AppState.currentState);

  const HandleBackPressed = useCallback(() => {
    if (webView.current) {
      webView.current?.goBack();
      return true; // PREVENT DEFAULT BEHAVIOUR (EXITING THE APP)
    }
    return false;
  }, [webView.current]);

  const storePushNotificationsToken = useCallback(() => {
    if (pushNotificationsToken && webView.current) {
      console.log('TOKEN', pushNotificationsToken)
      setTimeout(() => {
        webView.current.injectJavaScript(
`window.api.poke({
  app: "settings-store",
  mark: "settings-event",
  json: {
    "put-entry": {
      "desk": "landscape",
      "bucket-key": "escape-app",
      "entry-key": "expo-token",
      "value": "${pushNotificationsToken}",
    }
  }
});`
        );
      }, 10000);
    }
  }, [pushNotificationsToken, webView.current]);

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

  const handleUrlError = useCallback((event: WebViewHttpErrorEvent) => {
    if (event.nativeEvent.statusCode === 404) {
      setEscapeInstalled(false);
    }
  }, [setEscapeInstalled]);

  const onNavStateChange = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
  }, [setCanGoBack]);

  const mobileParam = 'isMobileApp=true';
  const uri = `${url}${url.includes('?') ? '&' : '?'}${mobileParam}`;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        key={webViewKey}
        onHttpError={handleUrlError}
        style={styles.webview}
        allowsBackForwardNavigationGestures
        scalesPageToFit
        sharedCookiesEnabled
        ref={webView}
        source={{ uri }}
        onNavigationStateChange={onNavStateChange}
        onMessage={onMessage}
        androidHardwareAccelerationDisabled={androidHardwareAccelerationDisabled}
        forceDarkOn={colorScheme === 'dark'}
        onLoadEnd={storePushNotificationsToken}
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
