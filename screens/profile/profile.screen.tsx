import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import useUserData from "@/hooks/useUserData";
import { LinearGradient } from "expo-linear-gradient";
import { scale, verticalScale } from "react-native-size-matters";
import {
  fontSizes,
  IsAndroid,
} from "@/themes/app.constant";
import ThemeSwitcher from "@/components/common/theme.switcher";
import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import useGetBookings from "@/hooks/fetch/useGetBookings";

// ── Section config ──────────────────────────
interface MenuItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
  chevronColor?: string;
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { name, email, avatar } = useUserData();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { bookings } = useGetBookings();

  const isDark = theme.dark;
  const enrolledCount = bookings.length;
  const completedCount = bookings.filter((b) => b.progress === 100).length;
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const ml = isRTL ? { marginRight: scale(12) } : { marginLeft: scale(12) };
  const chevronName = isRTL ? "chevron-left" : "chevron-right";

  const colors = {
    bg: isDark ? "#0f1117" : "#f4f6fa",
    card: isDark ? "#1a1d27" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    iconBg: isDark ? "rgba(30,123,185,0.12)" : "#eef5fb",
    iconColor: isDark ? "#60a5fa" : "#1e7bb9",
  };

  // ── Logout handler ────────────────────────
  const logoutHandler = async () => {
    setLoggingOut(true);
    try {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      await SecureStore.deleteItemAsync("tokenExpiry");
      await SecureStore.deleteItemAsync("name");
      await SecureStore.deleteItemAsync("email");
      await SecureStore.deleteItemAsync("avatar");
      await SecureStore.deleteItemAsync("userId");
      await SecureStore.deleteItemAsync("birthday");
    } catch (e) {
    }
    setShowLogoutModal(false);
    setLoggingOut(false);
    router.replace("/(routes)/onboarding");
  };

  // ── Menu sections ─────────────────────────
  const generalItems: MenuItem[] = [
    {
      icon: <Feather name="user" size={scale(20)} color={colors.iconColor} />,
      title: t("profile.myProfile"),
      subtitle: t("profile.myProfileSubtitle"),
      onPress: () => router.push("/(routes)/edit-profile" as any),
    },
    {
      icon: <FontAwesome name="support" size={scale(18)} color={colors.iconColor} />,
      title: t("profile.supportCenter"),
      subtitle: t("profile.supportCenterSubtitle"),
      onPress: () => router.push("/(routes)/support-center"),
    },
    {
      icon: <Ionicons name="notifications-outline" size={scale(20)} color={colors.iconColor} />,
      title: t("profile.notifications"),
      subtitle: t("profile.notificationsSubtitle"),
      onPress: () => router.push("/(routes)/notification"),
    },
  ];

  const preferencesItems: MenuItem[] = [
    {
      icon: <Ionicons name="settings-outline" size={scale(20)} color={colors.iconColor} />,
      title: t("profile.settings"),
      subtitle: t("profile.settingsSubtitle"),
      onPress: () => router.push("/(routes)/settings"),
    },
    {
      icon: <MaterialIcons name="policy" size={scale(20)} color={colors.iconColor} />,
      title: t("profile.privacyPolicy"),
      subtitle: t("profile.privacyPolicySubtitle"),
      onPress: async () =>
        await WebBrowser.openBrowserAsync("https://sasl.sba.gov.sa/ar/p/privacy"),
    },
  ];

  // ── Render a grouped card of menu items ───
  const renderSection = (items: MenuItem[], sectionTitle?: string) => (
    <View style={{ marginBottom: verticalScale(16) }}>
      {sectionTitle && (
        <Text
          style={{
            fontSize: fontSizes.FONT13,
            fontFamily: "Poppins_600SemiBold",
            color: colors.textSecondary,
            textAlign,
            marginBottom: verticalScale(8),
            marginHorizontal: scale(4),
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {sectionTitle}
        </Text>
      )}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: scale(16),
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.6}
            onPress={item.onPress}
            style={{
              flexDirection: rowDir,
              alignItems: "center",
              paddingVertical: verticalScale(14),
              paddingHorizontal: scale(16),
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: scale(38),
                height: scale(38),
                borderRadius: scale(12),
                backgroundColor: colors.iconBg,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {item.icon}
            </View>

            {/* Text */}
            <View style={[{ flex: 1 }, ml]}>
              <Text
                style={{
                  fontSize: fontSizes.FONT16,
                  fontFamily: "Poppins_500Medium",
                  color: colors.text,
                  textAlign,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontSize: fontSizes.FONT12,
                  fontFamily: "Poppins_400Regular",
                  color: colors.textSecondary,
                  textAlign,
                  marginTop: verticalScale(1),
                }}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </View>

            {/* Chevron */}
            <Feather
              name={chevronName as any}
              size={scale(16)}
              color={colors.textSecondary}
              style={{ opacity: 0.5 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />

      {/* Header Gradient */}
      <LinearGradient
        colors={isDark ? ["#1a1d27", "#0f1117"] : ["#1e7bb9", "#0f64a7"]}
        style={{
          paddingTop: Platform.OS === "ios" ? verticalScale(50) : verticalScale(35),
          paddingBottom: verticalScale(18),
          paddingHorizontal: scale(20),
        }}
      >
        <View
          style={{
            flexDirection: rowDir,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: fontSizes.FONT24 || 24,
              fontFamily: "Poppins_600SemiBold",
              color: "#fff",
            }}
          >
            {t("profile.profile")}
          </Text>
          <ThemeSwitcher />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: verticalScale(140),
          paddingHorizontal: scale(16),
          paddingTop: verticalScale(14),
        }}
      >
        {/* ── Profile Card ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/(routes)/edit-profile" as any)}
          style={{
            backgroundColor: colors.card,
            borderRadius: scale(20),
            padding: scale(18),
            flexDirection: rowDir,
            alignItems: "center",
            shadowColor: isDark ? "#000" : "#94a3b8",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.3 : 0.12,
            shadowRadius: 16,
            elevation: 8,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: verticalScale(20),
          }}
        >
          {/* Avatar */}
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{
                width: scale(54),
                height: scale(54),
                borderRadius: scale(27),
                borderWidth: 2,
                borderColor: isDark ? "rgba(96,165,250,0.3)" : "rgba(30,123,185,0.2)",
              }}
            />
          ) : (
            <LinearGradient
              colors={isDark ? ["#2a2d3a", "#1e2130"] : ["#e0edf7", "#cde0f0"]}
              style={{
                width: scale(54),
                height: scale(54),
                borderRadius: scale(27),
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: isDark ? "rgba(96,165,250,0.2)" : "rgba(30,123,185,0.15)",
              }}
            >
              <Feather
                name="user"
                size={scale(24)}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </LinearGradient>
          )}

          {/* Name & Email */}
          <View style={[{ flex: 1 }, ml]}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: fontSizes.FONT18,
                fontFamily: "Poppins_600SemiBold",
                color: colors.text,
                textAlign,
              }}
            >
              {name || "—"}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: fontSizes.FONT13,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                textAlign,
                marginTop: verticalScale(1),
              }}
            >
              {email || "—"}
            </Text>
          </View>

          {/* Edit Button */}
          <View
            style={{
              width: scale(32),
              height: scale(32),
              borderRadius: scale(10),
              backgroundColor: colors.iconBg,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feather name="edit-2" size={scale(14)} color={colors.iconColor} />
          </View>
        </TouchableOpacity>

        {/* ── Stats Row ──────────────────────── */}
        <View
          style={{
            flexDirection: rowDir,
            gap: scale(12),
            marginBottom: verticalScale(20),
          }}
        >
          <LinearGradient
            colors={["#0ea5e9", "#0284c7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: scale(16),
              padding: scale(16),
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: fontSizes.FONT28 || 28,
                fontFamily: "Poppins_700Bold",
                color: "#fff",
              }}
            >
              {enrolledCount}
            </Text>
            <Text
              style={{
                fontSize: fontSizes.FONT12,
                fontFamily: "Poppins_500Medium",
                color: "rgba(255,255,255,0.85)",
                marginTop: verticalScale(2),
              }}
            >
              {t("profile.enrolled")}
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={["#8b5cf6", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: scale(16),
              padding: scale(16),
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: fontSizes.FONT28 || 28,
                fontFamily: "Poppins_700Bold",
                color: "#fff",
              }}
            >
              1
            </Text>
            <Text
              style={{
                fontSize: fontSizes.FONT12,
                fontFamily: "Poppins_500Medium",
                color: "rgba(255,255,255,0.85)",
                marginTop: verticalScale(2),
              }}
            >
              {t("profile.certificates")}
            </Text>
          </LinearGradient>
        </View>

        {/* ── General Section ────────────────── */}
        {renderSection(generalItems, t("profile.generalSection"))}

        {/* ── Preferences Section ────────────── */}
        {renderSection(preferencesItems, t("profile.preferencesSection"))}

        {/* ── Logout ─────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => setShowLogoutModal(true)}
          style={{
            flexDirection: rowDir,
            alignItems: "center",
            backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "#fef2f2",
            borderRadius: scale(16),
            paddingVertical: verticalScale(14),
            paddingHorizontal: scale(16),
            borderWidth: 1,
            borderColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.12)",
          }}
        >
          <View
            style={{
              width: scale(38),
              height: scale(38),
              borderRadius: scale(12),
              backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="logout" size={scale(20)} color="#ef4444" />
          </View>
          <View style={[{ flex: 1 }, ml]}>
            <Text
              style={{
                fontSize: fontSizes.FONT16,
                fontFamily: "Poppins_600SemiBold",
                color: "#ef4444",
                textAlign,
              }}
            >
              {t("profile.logout")}
            </Text>
            <Text
              style={{
                fontSize: fontSizes.FONT12,
                fontFamily: "Poppins_400Regular",
                color: "#ef4444",
                opacity: 0.65,
                textAlign,
                marginTop: verticalScale(1),
              }}
            >
              {t("profile.logoutSubtitle")}
            </Text>
          </View>
          <Feather name={chevronName as any} size={scale(16)} color="#ef4444" style={{ opacity: 0.5 }} />
        </TouchableOpacity>
      </ScrollView>

      {/* ── Logout Confirmation Modal ──────────── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => !loggingOut && setShowLogoutModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              width: "85%",
              backgroundColor: isDark ? "#1a1d27" : "#ffffff",
              borderRadius: scale(20),
              padding: scale(28),
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <View
              style={{
                width: scale(68),
                height: scale(68),
                borderRadius: scale(34),
                backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: verticalScale(16),
              }}
            >
              <MaterialIcons name="logout" size={scale(32)} color="#ef4444" />
            </View>

            <Text
              style={{
                fontSize: fontSizes.FONT20,
                fontFamily: "Poppins_600SemiBold",
                color: isDark ? "#f1f5f9" : "#1e293b",
                textAlign: "center",
                marginBottom: verticalScale(8),
              }}
            >
              {t("profile.logoutConfirmTitle")}
            </Text>

            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_400Regular",
                color: isDark ? "#94a3b8" : "#64748b",
                textAlign: "center",
                lineHeight: 22,
                marginBottom: verticalScale(24),
                paddingHorizontal: scale(8),
              }}
            >
              {t("profile.logoutConfirmMessage")}
            </Text>

            {loggingOut ? (
              <View style={{ paddingVertical: verticalScale(14) }}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text
                  style={{
                    fontSize: fontSizes.FONT13,
                    fontFamily: "Poppins_500Medium",
                    color: isDark ? "#94a3b8" : "#64748b",
                    marginTop: verticalScale(10),
                    textAlign: "center",
                  }}
                >
                  {t("profile.loggingOut")}
                </Text>
              </View>
            ) : (
              <View style={{ width: "100%", gap: verticalScale(10) }}>
                <TouchableOpacity
                  onPress={logoutHandler}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: "#ef4444",
                    paddingVertical: verticalScale(14),
                    borderRadius: scale(14),
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: fontSizes.FONT16,
                      fontFamily: "Poppins_600SemiBold",
                    }}
                  >
                    {t("profile.logoutConfirm")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowLogoutModal(false)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                    paddingVertical: verticalScale(14),
                    borderRadius: scale(14),
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? "#f1f5f9" : "#1e293b",
                      fontSize: fontSizes.FONT16,
                      fontFamily: "Poppins_600SemiBold",
                    }}
                  >
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
