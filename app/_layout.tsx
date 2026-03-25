import React, { useState, useEffect, useCallback } from "react";
import { SplashScreen, Stack } from "expo-router";
import { ThemeProvider, useTheme } from "@/context/theme.context";
import { LanguageProvider } from "@/context/language.context";
import {
  Poppins_600SemiBold,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_500Medium,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Platform, I18nManager } from "react-native";
import { NotificationProvider } from "@/context/notification.provider";
import { LogBox } from "react-native";
import { startNetworkLogging } from "react-native-network-logger";
import AnimatedSplashScreen from "@/components/common/animated-splash";

// Start intercepting network requests for debugging
startNetworkLogging();

// ALWAYS disable native I18nManager RTL — the app handles RTL manually via isRTL checks
// (Using both I18nManager.forceRTL AND manual isRTL causes a double-flip problem)
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Conditionally import and apply withIAPContext only on native platforms
let withIAPContext: any = null;
if (Platform.OS !== "web") {
  try {
    const iapModule = require("react-native-iap");
    withIAPContext = iapModule.withIAPContext;
  } catch (e) {
    // IAP not available
  }
}

// Keep the native splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

LogBox.ignoreAllLogs();

function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Poppins_600SemiBold,
    Poppins_300Light,
    Poppins_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
  });

  const [isAppReady, setIsAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (loaded) {
      // Hide the native splash screen once fonts are loaded
      SplashScreen.hideAsync();
      // Let the animated splash play for a moment before signaling ready
      const timer = setTimeout(() => {
        setIsAppReady(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  const onSplashAnimationComplete = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <AnimatedSplashScreen
      isAppReady={isAppReady}
      onAnimationComplete={onSplashAnimationComplete}
    >
      <LanguageProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(routes)/onboarding/index" />
              <Stack.Screen name="(routes)/certification/index" />
              <Stack.Screen name="(routes)/webview/index" />
              <Stack.Screen name="(routes)/settings/index" />
              <Stack.Screen name="(routes)/course-access" />
              <Stack.Screen name="(routes)/notification/index" />
              <Stack.Screen name="(routes)/network-logger/index" />
              <Stack.Screen name="(routes)/edit-profile/index" />
            </Stack>
          </NotificationProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AnimatedSplashScreen>
  );
}

// Only wrap with IAP context on native platforms
export default Platform.OS === "web" || !withIAPContext
  ? RootLayout
  : withIAPContext(RootLayout);
