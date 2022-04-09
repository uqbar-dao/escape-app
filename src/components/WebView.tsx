import React, { useState, useEffect, useRef, useCallback } from "react";
import { Alert, AppState, AppStateStatus, BackHandler, Linking, Platform, Pressable, SafeAreaView, StyleSheet, useColorScheme } from "react-native";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { WebViewErrorEvent, WebViewHttpErrorEvent, WebViewNavigationEvent } from "react-native-webview/lib/WebViewTypes";
import { Ionicons } from "@expo/vector-icons";
import { APP_URL_REGEX, ESCAPE_URL_REGEX, GRID_URL_REGEX, ESCAPE_DISTRO_SHIP, INSIDE_APP_URLS } from '../constants/Webview';
import useStore from "../hooks/useStore";

interface WebviewProps {
  url: string;
  ship: string;
  shipUrl: string;
  pushNotificationsToken?: string;
  onMessage?: (event: WebViewMessageEvent) => void;
  androidHardwareAccelerationDisabled?: boolean;
}

const Webview = ({
  url,
  ship,
  shipUrl,
  pushNotificationsToken,
  onMessage,
  androidHardwareAccelerationDisabled = false
}: WebviewProps) => {
  const { setLoading, setPath } = useStore();
  const webView = useRef<any>(null);
  const colorScheme = useColorScheme();
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [webViewKey, setWebViewKey] = useState(0);
  const [escapeInstalled, setEscapeInstalled] = useState(true);
  const appState = useRef(AppState.currentState);

  const HandleBackPressed = useCallback(() => {
    if (webView?.current) {
      webView.current?.goBack();
      return true; // PREVENT DEFAULT BEHAVIOUR (EXITING THE APP)
    }
    return false;
  }, [webView.current]);

  const onLoadEnd = useCallback((e: WebViewNavigationEvent | WebViewErrorEvent) => {
    if (webView.current && !e.nativeEvent.loading && !e.nativeEvent?.code) {
      if (ESCAPE_URL_REGEX.test(url) && pushNotificationsToken) {
        setTimeout(() => {
          webView?.current?.injectJavaScript(
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
        }, 5000);
      }

      if (GRID_URL_REGEX.test(url) && !escapeInstalled) {
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
                setTimeout(() => {
                  webView?.current?.injectJavaScript(
        `window.docket().requestTreaty('${ESCAPE_DISTRO_SHIP}', 'escape');
        window.docket().installDocket('${ESCAPE_DISTRO_SHIP}', 'escape');`
                  );
                  setEscapeInstalled(true);
                  Alert.alert(
                    "Installing EScape",
                    `EScape should now be installing, if it does not install please install manually from ${ESCAPE_DISTRO_SHIP}. \n\nTap on the EScape tile to open it when installation is complete.`,
                    [{ text: "OK", style: "cancel" }],
                    { cancelable: true }
                  )
                  setLoading(false);
                }, 2000);
              },
              style: "default",
            },
          ],
          { cancelable: true }
        );
      }
    }
  }, [ship, pushNotificationsToken, webView.current, escapeInstalled, url, setPath]);

  useEffect(() => {
    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", HandleBackPressed);
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        webView?.current?.injectJavaScript('window.bootstrapApi(true)');
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
    } else if (event.nativeEvent.statusCode > 399) {
      Alert.alert(
        "Error",
        "There was an error loading the page. Please check your server and try again.",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Refresh",
            onPress: () => {
              webView?.current?.reload()
            },
            style: "default",
          },
        ],
        { cancelable: true }
      );
    }
  }, [setEscapeInstalled, url, ship]);

  const onNavStateChange = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
    setCurrentUrl(event.url);

    if ((GRID_URL_REGEX.test(url)) && !GRID_URL_REGEX.test(event.url)) {
      const appUrl = event.url.match(APP_URL_REGEX);
      if (appUrl) {
        setPath(ship, appUrl[0]);
      }
    }

    if (!event.loading) {
      webView?.current?.injectJavaScript('window.isMobileApp = true')
    }
  }, [url, setCanGoBack, setCurrentUrl]);

  const shouldStartLoadWithRequest = useCallback((req) => {
    // open the link in native browser on iOS
    const openOutsideApp = Platform.OS === 'ios' &&
      !req.url.toLowerCase().includes(shipUrl.toLowerCase()) &&
      !INSIDE_APP_URLS.reduce((acc, cur) => acc || req.url.includes(cur), false);

    if (openOutsideApp) {
      Linking.openURL(req.url);
      return false;
    }

    return true;
  }, [shipUrl]);
  
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        key={webViewKey}
        ref={webView}
        source={{ uri: url }}
        startInLoadingState
        allowsBackForwardNavigationGestures
        scalesPageToFit
        sharedCookiesEnabled
        androidHardwareAccelerationDisabled={androidHardwareAccelerationDisabled}
        forceDarkOn={colorScheme === 'dark'}
        setSupportMultipleWindows={!url.includes('/apps/grid/')}
        onMessage={onMessage}
        onNavigationStateChange={onNavStateChange}
        onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
        onHttpError={handleUrlError}
        onLoadEnd={onLoadEnd}
        injectedJavaScript='window.isMobileApp = true'
        pullToRefreshEnabled
      />
      {!currentUrl.includes(shipUrl.toLowerCase()) && <Pressable style={styles.backButton} onPress={() => webView?.current.goBack()}>
        <Ionicons name="arrow-back" size={24} color='black' />
      </Pressable>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  webview: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 40,
    width: 40,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomRightRadius: 8,
  },
});

export default Webview;
