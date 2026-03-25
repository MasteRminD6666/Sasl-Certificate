import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale } from "react-native-size-matters";
import { fontSizes } from "@/themes/app.constant";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import AppHeader from "@/components/common/app-header";

export default function SaslWebViewScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const isDark = theme.dark;
  const webviewRef = useRef<WebView>(null);
  const params = useLocalSearchParams<{ url: string; title: string }>();

  const [loading, setLoading] = useState(true);
  const [tokensReady, setTokensReady] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [canGoBack, setCanGoBack] = useState(false);

  const targetUrl = params.url || "https://sasl.sba.gov.sa/ar/";
  const pageTitle = params.title || t("certSteps.header.title");

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const refresh = await SecureStore.getItemAsync("refreshToken");
        if (token) setAccessToken(token);
        if (refresh) setRefreshToken(refresh);
      } catch (e) {
      } finally {
        setTokensReady(true);
      }
    };
    loadTokens();
  }, []);

  // JavaScript to inject auth tokens into the WebView localStorage
  const getInjectedJS = () => {
    if (!accessToken) return "true;";
    // Escape any special chars in token for safe JS string
    const safeToken = accessToken.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const safeRefresh = refreshToken.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `
      (function() {
        try {
          localStorage.setItem('auth_access_token', '${safeToken}');
          ${safeRefresh ? `localStorage.setItem('auth_refresh_token', '${safeRefresh}');` : ""}
          localStorage.setItem('auth_token_expiry', '${Date.now() + 3600000}');
          document.cookie = "access_token=${safeToken}; path=/; domain=.sba.gov.sa; SameSite=Lax";
          window.dispatchEvent(new Event('storage'));
        } catch(e) {}
        true;
      })();
    `;
  };

  const colors = {
    bg: isDark ? "#0f1117" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    headerBg: isDark ? "#1a1d27" : "#ffffff",
    border: isDark ? "#2a2d3a" : "#e2e8f0",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <AppHeader
        title={pageTitle}
        rightElement={
          <TouchableOpacity
            onPress={() => canGoBack && webviewRef.current?.goBack()}
            disabled={!canGoBack}
            style={{
              width: scale(36),
              height: scale(36),
              borderRadius: scale(18),
              backgroundColor: "rgba(255,255,255,0.15)",
              justifyContent: "center",
              alignItems: "center",
              opacity: canGoBack ? 1 : 0.3,
            }}
          >
            <Ionicons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={scale(20)}
              color="#fff"
            />
          </TouchableOpacity>
        }
      />

      {/* Loading overlay */}
      {loading && (
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? verticalScale(100) : verticalScale(85),
            left: 0,
            right: 0,
            zIndex: 10,
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#1e7bb9" />
        </View>
      )}

      {/* WebView - render as soon as tokens are checked */}
      {tokensReady ? (
        <WebView
          ref={webviewRef}
          source={{
            uri: targetUrl,
            ...(accessToken
              ? { headers: { Authorization: `Bearer ${accessToken}` } }
              : {}),
          }}
          injectedJavaScriptBeforeContentLoaded={getInjectedJS()}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
          }}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          startInLoadingState={false}
          allowsBackForwardNavigationGestures={true}
          userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          style={{ flex: 1 }}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#1e7bb9" />
        </View>
      )}
    </View>
  );
}
