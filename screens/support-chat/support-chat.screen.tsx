import React, { useState, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StatusBar,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { scale, verticalScale } from "react-native-size-matters";
import { fontSizes } from "@/themes/app.constant";
import AppHeader from "@/components/common/app-header";
import { Feather } from "@expo/vector-icons";

const TAWK_PROPERTY_ID = "6808c5a54a25191909a0290f";
const TAWK_WIDGET_ID = "1iph4840n";
const TAWK_DIRECT_URL = `https://tawk.to/chat/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;

export default function SupportChatScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const isDark = theme.dark;
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const colors = {
    bg: isDark ? "#0f1117" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
  };

  const handleRetry = () => {
    setHasError(false);
    setLoading(true);
    webviewRef.current?.reload();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={t("support.chatNow")} />

      {/* Loading overlay */}
      {loading && !hasError && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.bg,
          }}
        >
          <ActivityIndicator size="large" color="#1e7bb9" />
          <Text
            style={{
              marginTop: verticalScale(12),
              fontSize: fontSizes.FONT14,
              fontFamily: "Poppins_500Medium",
              color: colors.textSecondary,
            }}
          >
            {t("common.loading")}
          </Text>
        </View>
      )}

      {/* Error state */}
      {hasError && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: scale(32),
          }}
        >
          <View
            style={{
              width: scale(60),
              height: scale(60),
              borderRadius: scale(30),
              backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: verticalScale(14),
            }}
          >
            <Feather name="wifi-off" size={scale(26)} color="#ef4444" />
          </View>
          <Text
            style={{
              fontSize: fontSizes.FONT16,
              fontFamily: "Poppins_600SemiBold",
              color: colors.text,
              textAlign: "center",
              marginBottom: verticalScale(6),
            }}
          >
            {t("common.error")}
          </Text>
          <Text
            style={{
              fontSize: fontSizes.FONT13,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: verticalScale(20),
            }}
          >
            {t("auth.networkError")}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            activeOpacity={0.8}
            style={{
              backgroundColor: "#1e7bb9",
              paddingHorizontal: scale(28),
              paddingVertical: verticalScale(12),
              borderRadius: scale(12),
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_600SemiBold",
              }}
            >
              {t("common.confirm")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView - Tawk.to direct chat URL */}
      {!hasError && (
        <WebView
          ref={webviewRef}
          source={{ uri: TAWK_DIRECT_URL }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent.statusCode >= 400) {
              setLoading(false);
              setHasError(true);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          startInLoadingState={false}
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            opacity: loading ? 0 : 1,
          }}
          originWhitelist={["*"]}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />
      )}
    </View>
  );
}
