import React, { useState, useEffect, useRef, useCallback } from "react";
import { Alert, AppState, AppStateStatus, BackHandler, Dimensions, Platform, SafeAreaView, StyleSheet, useColorScheme } from "react-native";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { WebViewHttpErrorEvent } from "react-native-webview/lib/WebViewTypes";
import { APP_URL_REGEX, ESCAPE_URL_REGEX, GRID_URL_REGEX, LANDSCAPE_URL_REGEX, ESCAPE_DISTRO_SHIP } from '../constants/Webview';
import useStore from "../hooks/useStore";

interface WebviewProps {
  url: string;
  ship: string;
  pushNotificationsToken?: string;
  onMessage?: (event: WebViewMessageEvent) => void;
  androidHardwareAccelerationDisabled?: boolean;
}

const Webview = ({
  url,
  ship,
  pushNotificationsToken,
  onMessage,
  androidHardwareAccelerationDisabled = false
}: WebviewProps) => {
  const { setLoading, setPath } = useStore();
  const webView = useRef<any>(null);
  const colorScheme = useColorScheme();
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [escapeInstalled, setEscapeInstalled] = useState(true);
  const [downloadEscape, setDownloadEscape] = useState(false);

  const appState = useRef(AppState.currentState);

  const HandleBackPressed = useCallback(() => {
    if (webView.current) {
      webView.current?.goBack();
      return true; // PREVENT DEFAULT BEHAVIOUR (EXITING THE APP)
    }
    return false;
  }, [webView.current]);

  const onLoadEnd = useCallback(() => {
    if (webView.current) {
      if (ESCAPE_URL_REGEX.test(url) && pushNotificationsToken) {
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

      if (GRID_URL_REGEX.test(url) && !escapeInstalled && !downloadEscape) {
        Alert.alert(
          "Install EScape",
          "EScape is not installed, would you like to install it?",
          [
            {
              text: "No",
              onPress: () => null,
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: () => {
                setDownloadEscape(true);
                if (setPath) {
                  setPath(ship, '/apps/landscape/');
                  setLoading(true);
                }
              },
              style: "default",
            },
          ],
          { cancelable: true }
        );
      }

      if (LANDSCAPE_URL_REGEX.test(url) && !escapeInstalled && downloadEscape) {
        setTimeout(() => {
          webView.current.injectJavaScript(
`window.api.subscribeOnce("treaty", "/treaty/${ESCAPE_DISTRO_SHIP}/escape", 20000);
window.api.poke({ app: "docket", json: "${ESCAPE_DISTRO_SHIP}/escape", mark: "docket-install" });`
          );
          setEscapeInstalled(true);
          if (setPath) {
            setPath(ship, '/apps/grid/');
            Alert.alert(
              "Installing EScape",
              `EScape should now be installing, if it does not install please install manually from ${ESCAPE_DISTRO_SHIP}. \n\nTap on the EScape tile to open it when installation is complete.`,
              [{ text: "OK", style: "cancel" }],
              { cancelable: true }
            )
          }
          setLoading(false);
        }, 2000);
      }
    }
  }, [ship, pushNotificationsToken, webView.current, escapeInstalled, downloadEscape, url, setPath]);

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
    if (event.nativeEvent.statusCode === 404 && ESCAPE_URL_REGEX.test(url)) {
      setEscapeInstalled(false);
      if (setPath) {
        setPath(ship, '/apps/grid/');
      }
    }
  }, [setEscapeInstalled, url, ship]);

  const onNavStateChange = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);

    if (GRID_URL_REGEX.test(url) && !GRID_URL_REGEX.test(event.url)) {
      const appUrl = event.url.match(APP_URL_REGEX);
      setPath(ship, appUrl ? appUrl[0] : '/apps/escape/');
    }
  }, [url, setCanGoBack]);

  const mobileParam = 'isMobileApp=true';
  let uri = url;
  if (ESCAPE_URL_REGEX.test(url)) {
    uri = `${url}${url.includes('?') ? '&' : '?'}${mobileParam}`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        key={webViewKey}
        ref={webView}
        source={{ uri }}
        startInLoadingState
        allowsBackForwardNavigationGestures
        scalesPageToFit
        sharedCookiesEnabled
        androidHardwareAccelerationDisabled={androidHardwareAccelerationDisabled}
        forceDarkOn={colorScheme === 'dark'}
        setSupportMultipleWindows={!uri.includes('/apps/grid/')}
        onMessage={onMessage}
        onNavigationStateChange={onNavStateChange}
        onHttpError={handleUrlError}
        onLoadEnd={onLoadEnd}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  webview: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});

export default Webview;
