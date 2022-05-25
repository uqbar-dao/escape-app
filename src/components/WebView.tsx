import React, { useState, useEffect, useRef, useCallback } from "react";
import { Alert, AppState, AppStateStatus, BackHandler, Dimensions, Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { WebViewErrorEvent, WebViewHttpErrorEvent, WebViewNavigationEvent, WebViewProgressEvent } from "react-native-webview/lib/WebViewTypes";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Camera } from 'expo-camera';
import { APP_URL_REGEX, ESCAPE_URL_REGEX, GRID_URL_REGEX, ESCAPE_DISTRO_SHIP, INSIDE_APP_URLS , HANDSHAKE_URL_REGEX} from '../constants/Webview';
import useStore from "../state/useStore";
import { expo } from '../../app.json';
import { isInternalUrl } from "../util/url";
import { useNavigation } from "@react-navigation/native";
import { useThemeWatcher } from "../hooks/useThemeWatcher";

interface WebviewProps {
  url: string;
  ship: string;
  shipUrl: string;
  pushNotificationsToken?: string;
  onMessage?: (event: WebViewMessageEvent) => void;
}

const Webview = React.forwardRef(({
  url,
  ship,
  shipUrl,
  pushNotificationsToken,
  onMessage,
}: WebviewProps, webViewRef: any) => {
  const { setLoading, setPath } = useStore();
  const colorScheme = useColorScheme();
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [webViewKey, setWebViewKey] = useState(0);
  const [escapeInstalled, setEscapeInstalled] = useState(true);
  const [installPromptActive, setInstallPromptActive] = useState(false)
  const appState = useRef(AppState.currentState);
  const navigation = useNavigation();
  const { theme: { colors } } = useThemeWatcher();

  const styles = getStyles(colors);

  const setAppVersion = `window.isMobileApp = true; window.mobileAppVersion = '${expo.version}';`;

  const HandleBackPressed = useCallback(() => {
    if (webViewRef?.current) {
      webViewRef.current?.goBack();
      return true; // PREVENT DEFAULT BEHAVIOUR (EXITING THE APP)
    }
    return false;
  }, [webViewRef.current]);

  const handleEscapeNotInstalled = useCallback(() => {
    setEscapeInstalled(false);
    setInstallPromptActive(false)
    if (setPath) {
      setPath(ship, '/apps/grid/');
    }
  }, [setEscapeInstalled, setInstallPromptActive, setPath])

  const onLoadProgress = useCallback(async (e: WebViewProgressEvent) => {
    if (e.nativeEvent.title === 'Webpage not available' && ESCAPE_URL_REGEX.test(e.nativeEvent.url)) {
      handleEscapeNotInstalled();
    }
  }, [ship, pushNotificationsToken, webViewRef.current, escapeInstalled, url, setPath]);

  const onLoadEnd = useCallback(async (e: WebViewNavigationEvent | WebViewErrorEvent) => {
    if (webViewRef.current && !e.nativeEvent.loading && !e.nativeEvent?.code) {
      if (HANDSHAKE_URL_REGEX.test(url)) {
        const { status: existingStatus } = await Camera.getCameraPermissionsAsync();
        let finalStatus = existingStatus;
  
        if (existingStatus !== 'denied') {
          if (existingStatus !== 'granted') {
            const { status } = await Camera.requestCameraPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            alert('You will not be able to scan QR codes until you enable camera permissions in your settings.');
            return;
          }
        }
      }

      if (ESCAPE_URL_REGEX.test(url) && pushNotificationsToken) {
        setTimeout(() => {
          webViewRef?.current?.injectJavaScript(
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

      if (GRID_URL_REGEX.test(url) && !escapeInstalled && !installPromptActive) {
        setInstallPromptActive(true)
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
                  webViewRef?.current?.injectJavaScript(
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
  }, [ship, pushNotificationsToken, webViewRef.current, escapeInstalled, url, setPath]);

  useEffect(() => {
    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", HandleBackPressed);
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        webViewRef?.current?.injectJavaScript('window.bootstrapApi(true)');
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
      handleEscapeNotInstalled();
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
              webViewRef?.current?.reload()
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
      webViewRef?.current?.injectJavaScript(setAppVersion);
    }
  }, [url, setCanGoBack, setCurrentUrl]);

  const shouldStartLoadWithRequest = useCallback((req) => {
    if (req.url.includes('/~notifications')) {
      navigation.navigate('Notifications');
      return false;
    } else if (req.url.includes('/~landscape/messages')) {
      navigation.navigate('Messages');
      return false;
    }
    // open the link in native browser on iOS
    const openOutsideApp = (Platform.OS === 'ios' &&
      !isInternalUrl(req.url, shipUrl) &&
      !INSIDE_APP_URLS.reduce((acc, cur) => acc || req.url.includes(cur), false))
      || HANDSHAKE_URL_REGEX.test(req.url);

    if (openOutsideApp) {
      Linking.openURL(req.url);
      return false;
    }

    return true;
  }, [shipUrl]);

  // let uri = url;
  // if (ESCAPE_URL_REGEX.test(url)) {
  //   uri = `${url}${url.includes('?') ? '&' : '?'}isMobileApp=true&mobileAppVersion=1.1.3`;
  // }

  return (
    <View style={styles.container}>
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ uri: url }}
        originWhitelist={['http://*', 'https://*', 'about:srcdoc', 'about:blank']}
        startInLoadingState
        pullToRefreshEnabled
        allowsBackForwardNavigationGestures
        scalesPageToFit
        sharedCookiesEnabled
        forceDarkOn={colorScheme === 'dark'}
        setSupportMultipleWindows={!url.includes('/apps/grid/')}
        onMessage={onMessage}
        onNavigationStateChange={onNavStateChange}
        onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
        onHttpError={handleUrlError}
        onLoadEnd={onLoadEnd}
        onLoadProgress={onLoadProgress}
        injectedJavaScript={setAppVersion}
      />
      {!currentUrl.includes(shipUrl.toLowerCase()) && <Pressable style={styles.backButton} onPress={() => webViewRef?.current.goBack()}>
        <Ionicons name="arrow-back" size={24} color='black' />
      </Pressable>}
    </View>
  );
});

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.white,
  },
  webview: {
    flex: 1,
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
