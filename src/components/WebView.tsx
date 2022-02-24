import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, BackHandler, Platform, SafeAreaView, StyleSheet, useColorScheme } from "react-native";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";

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
  const colorScheme = useColorScheme()
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
      "bucket-key": "escapeApp",
      "entry-key": "expoToken",
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

  const onNavStateChange = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
  }, [setCanGoBack]);

  const mobileParam = 'isMobileApp=true';
  const uri = `${url}${url.includes('?') ? '&' : '?'}${mobileParam}`;

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
