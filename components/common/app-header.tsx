import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale } from "react-native-size-matters";
import { fontSizes } from "@/themes/app.constant";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { router } from "expo-router";

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  showBack?: boolean;
}

export default function AppHeader({ title, onBack, rightElement, showBack = true }: AppHeaderProps) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const isDark = theme.dark;

  return (
    <LinearGradient
      colors={isDark ? ["#1a1d27", "#0f1117"] : ["#1e7bb9", "#0f64a7"]}
      style={{
        paddingTop: Platform.OS === "ios" ? verticalScale(50) : verticalScale(35),
        paddingBottom: verticalScale(16),
        paddingHorizontal: scale(16),
      }}
    >
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {showBack ? (
          <TouchableOpacity
            onPress={onBack || (() => router.back())}
            style={{
              width: scale(36),
              height: scale(36),
              borderRadius: scale(18),
              backgroundColor: "rgba(255,255,255,0.15)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={scale(20)}
              color="#fff"
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: scale(36) }} />
        )}

        <Text
          style={{
            fontSize: fontSizes.FONT18,
            fontFamily: "Poppins_600SemiBold",
            color: "#fff",
            flex: 1,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        {rightElement ? (
          rightElement
        ) : (
          <View style={{ width: scale(36) }} />
        )}
      </View>
    </LinearGradient>
  );
}
