import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { scale, verticalScale } from "react-native-size-matters";
import { fontSizes } from "@/themes/app.constant";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import AppHeader from "@/components/common/app-header";
import axios from "axios";

const SASL_BASE = "https://sasl.sba.gov.sa";

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const isDark = theme.dark;

  // ── State ────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatar, setAvatar] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState("1995");
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [selectedDay, setSelectedDay] = useState("01");
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Colors ───────────────────────────────
  const colors = {
    bg: isDark ? "#0f1117" : "#f8fafb",
    card: isDark ? "#1a1d27" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    primary: "#1e7bb9",
    primaryDark: "#0f64a7",
    border: isDark ? "#2a2d3a" : "#e2e8f0",
    inputBg: isDark ? "#1e2130" : "#f8f9fa",
    inputBorder: isDark ? "#2a2d3a" : "#e2e8f0",
    error: "#ef4444",
    avatarBg: isDark ? "#2a2d3a" : "#e2e8f0",
    overlayBg: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
    selectedItem: isDark ? "rgba(30,123,185,0.2)" : "rgba(30,123,185,0.1)",
  };

  // ── Load existing data ───────────────────
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedName = await SecureStore.getItemAsync("name");
        const storedEmail = await SecureStore.getItemAsync("email");
        const storedAvatar = await SecureStore.getItemAsync("avatar");
        const storedBirthday = await SecureStore.getItemAsync("birthday");
        const storedUserId = await SecureStore.getItemAsync("userId");

        if (storedName) setName(storedName);
        if (storedEmail) setEmail(storedEmail);
        if (storedAvatar) setAvatar(storedAvatar);
        if (storedUserId) setUserId(storedUserId);
        if (storedBirthday) {
          setBirthday(storedBirthday);
          const parts = storedBirthday.split("-");
          if (parts.length === 3) {
            setSelectedYear(parts[0]);
            setSelectedMonth(parts[1]);
            setSelectedDay(parts[2]);
          }
        }
      } catch (e) {
      }
    };
    loadUserData();
  }, []);

  // ── Save profile ─────────────────────────
  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg(t("editProfile.nameRequired"));
      return;
    }
    if (!email.trim()) {
      setErrorMsg(t("editProfile.emailRequired"));
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const uid = userId || (await SecureStore.getItemAsync("userId")) || "";

      // Call SASL API to update profile
      if (token && uid) {
        const nameParts = name.trim().split(" ");
        const updateBody: any = {
          id: uid,
          email: email.trim(),
          firstname: nameParts[0] || "",
          lastname: nameParts.slice(1).join(" ") || "",
        };
        if (birthday) updateBody.birth_date = birthday;

        await axios.patch(
          `${SASL_BASE}/api/v2/users/${uid}`,
          updateBody,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "Accept-Language": "ar",
            },
          }
        );
      }

      // Save locally so profile screen picks up changes immediately
      await SecureStore.setItemAsync("name", name.trim());
      await SecureStore.setItemAsync("email", email.trim());
      if (birthday) await SecureStore.setItemAsync("birthday", birthday);
      if (avatar) await SecureStore.setItemAsync("avatar", avatar);

      setShowSuccessModal(true);
    } catch (e: any) {
      const apiMsg = e?.response?.data?.message || e?.response?.data?.error || "";
      setErrorMsg(apiMsg || t("editProfile.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  // ── Pick image ───────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("common.error"), t("editProfile.photoPermission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
      setHasChanges(true);
    }
  };

  // ── Open webview for advanced settings ───
  const handleAdvancedSettings = () => {
    const uid = userId || "0";
    router.push({
      pathname: "/(routes)/webview",
      params: {
        url: `https://sasl.sba.gov.sa/ar/u/${uid}/settings?t=account_details`,
        title: t("editProfile.accountSettings"),
      },
    } as any);
  };

  // ── Field label ──────────────────────────
  const FieldLabel = ({ text }: { text: string }) => (
    <Text
      style={{
        fontSize: fontSizes.FONT13,
        fontFamily: "Poppins_500Medium",
        color: colors.text,
        marginBottom: verticalScale(6),
        textAlign: isRTL ? "right" : "left",
      }}
    >
      {text}
    </Text>
  );

  // ── Text input field ─────────────────────
  const InputField = ({
    value,
    onChangeText,
    placeholder,
    icon,
    keyboardType = "default",
    editable = true,
  }: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: string;
    keyboardType?: any;
    editable?: boolean;
  }) => (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: colors.inputBorder,
        borderRadius: scale(12),
        backgroundColor: editable ? colors.inputBg : (isDark ? "#151722" : "#f0f0f0"),
        height: verticalScale(48),
        paddingHorizontal: scale(14),
        marginBottom: verticalScale(16),
      }}
    >
      <Ionicons
        name={icon as any}
        size={scale(18)}
        color={colors.textSecondary}
        style={{
          marginRight: isRTL ? 0 : scale(10),
          marginLeft: isRTL ? scale(10) : 0,
        }}
      />
      <TextInput
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setHasChanges(true);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        editable={editable}
        keyboardType={keyboardType}
        style={{
          flex: 1,
          fontSize: fontSizes.FONT15,
          fontFamily: "Poppins_400Regular",
          color: editable ? colors.text : colors.textSecondary,
          textAlign: isRTL ? "right" : "left",
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={t("editProfile.title")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(20),
          paddingBottom: verticalScale(100),
        }}
      >
        {/* ── Avatar Section ────────────────── */}
        <View style={{ alignItems: "center", marginBottom: verticalScale(28) }}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <View
              style={{
                width: scale(100),
                height: scale(100),
                borderRadius: scale(50),
                backgroundColor: colors.avatarBg,
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                borderWidth: 3,
                borderColor: colors.primary,
              }}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={scale(44)} color={colors.textSecondary} />
              )}
            </View>

            {/* Camera badge */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: scale(32),
                height: scale(32),
                borderRadius: scale(16),
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: colors.card,
              }}
            >
              <Ionicons name="camera" size={scale(16)} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: fontSizes.FONT12,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
              marginTop: verticalScale(8),
            }}
          >
            {t("editProfile.tapToChange")}
          </Text>
        </View>

        {/* ── Form Card ─────────────────────── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: scale(16),
            padding: scale(20),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 12,
            elevation: 3,
            marginBottom: verticalScale(16),
          }}
        >
          <Text
            style={{
              fontSize: fontSizes.FONT16,
              fontFamily: "Poppins_600SemiBold",
              color: colors.text,
              marginBottom: verticalScale(16),
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {t("editProfile.personalInfo")}
          </Text>

          {/* Name */}
          <FieldLabel text={t("editProfile.name")} />
          <InputField
            value={name}
            onChangeText={setName}
            placeholder={t("editProfile.namePlaceholder")}
            icon="person-outline"
          />

          {/* Email */}
          <FieldLabel text={t("editProfile.email")} />
          <InputField
            value={email}
            onChangeText={setEmail}
            placeholder={t("editProfile.emailPlaceholder")}
            icon="mail-outline"
            keyboardType="email-address"
          />

          {/* Birthday */}
          <FieldLabel text={t("editProfile.birthday")} />
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              borderRadius: scale(12),
              backgroundColor: colors.inputBg,
              height: verticalScale(48),
              paddingHorizontal: scale(14),
              marginBottom: verticalScale(4),
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={scale(18)}
              color={birthday ? colors.primary : colors.textSecondary}
              style={{
                marginRight: isRTL ? 0 : scale(10),
                marginLeft: isRTL ? scale(10) : 0,
              }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: fontSizes.FONT15,
                fontFamily: "Poppins_400Regular",
                color: birthday ? colors.text : colors.textSecondary,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {birthday || t("editProfile.birthdayPlaceholder")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Error Message ──────────────────── */}
        {errorMsg ? (
          <View
            style={{
              backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#fef2f2",
              borderRadius: scale(10),
              padding: scale(12),
              marginBottom: verticalScale(12),
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="alert-circle" size={scale(18)} color={colors.error} style={{ marginRight: isRTL ? 0 : scale(8), marginLeft: isRTL ? scale(8) : 0 }} />
            <Text style={{ flex: 1, fontSize: fontSizes.FONT13, fontFamily: "Poppins_400Regular", color: colors.error, textAlign: isRTL ? "right" : "left" }}>
              {errorMsg}
            </Text>
          </View>
        ) : null}

        {/* ── Save Button ───────────────────── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
          style={{ marginBottom: verticalScale(12) }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: verticalScale(50),
              borderRadius: scale(12),
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  fontSize: fontSizes.FONT16,
                  fontFamily: "Poppins_600SemiBold",
                  color: "#fff",
                }}
              >
                {t("editProfile.saveChanges")}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Advanced Settings (WebView) ────── */}
        <TouchableOpacity
          onPress={handleAdvancedSettings}
          activeOpacity={0.8}
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
            borderRadius: scale(12),
            height: verticalScale(50),
            borderWidth: 1.5,
            borderColor: colors.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <MaterialIcons
            name="settings"
            size={scale(20)}
            color={colors.primary}
            style={{
              marginRight: isRTL ? 0 : scale(8),
              marginLeft: isRTL ? scale(8) : 0,
            }}
          />
          <Text
            style={{
              fontSize: fontSizes.FONT15,
              fontFamily: "Poppins_500Medium",
              color: colors.primary,
            }}
          >
            {t("editProfile.advancedSettings")}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={scale(18)}
            color={colors.primary}
            style={{
              marginLeft: isRTL ? 0 : scale(6),
              marginRight: isRTL ? scale(6) : 0,
            }}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* ── Date Picker Modal ───────────────── */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: colors.overlayBg, justifyContent: "flex-end" }}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: scale(20),
              borderTopRightRadius: scale(20),
              paddingBottom: verticalScale(30),
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: scale(20),
                paddingVertical: verticalScale(16),
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: fontSizes.FONT16,
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.text,
                }}
              >
                {t("editProfile.selectBirthday")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = `${selectedYear}-${selectedMonth}-${selectedDay}`;
                  setBirthday(newDate);
                  setHasChanges(true);
                  setShowDatePicker(false);
                }}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: scale(16),
                  paddingVertical: verticalScale(8),
                  borderRadius: scale(8),
                }}
              >
                <Text
                  style={{
                    fontSize: fontSizes.FONT14,
                    fontFamily: "Poppins_500Medium",
                    color: "#fff",
                  }}
                >
                  {t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable columns */}
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                height: verticalScale(200),
                paddingHorizontal: scale(10),
                marginTop: verticalScale(8),
              }}
            >
              {/* Year */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: fontSizes.FONT11, fontFamily: "Poppins_500Medium", color: colors.textSecondary, marginBottom: verticalScale(6) }}>
                  {isRTL ? "السنة" : "Year"}
                </Text>
                <FlatList
                  data={Array.from({ length: 86 }, (_, i) => String(new Date().getFullYear() - i))}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  initialScrollIndex={Math.max(0, new Date().getFullYear() - parseInt(selectedYear))}
                  getItemLayout={(_, index) => ({ length: verticalScale(40), offset: verticalScale(40) * index, index })}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedYear(item)}
                      style={{
                        height: verticalScale(40),
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: selectedYear === item ? colors.selectedItem : "transparent",
                        borderRadius: scale(8),
                        marginHorizontal: scale(4),
                      }}
                    >
                      <Text style={{
                        fontSize: fontSizes.FONT15,
                        fontFamily: selectedYear === item ? "Poppins_600SemiBold" : "Poppins_400Regular",
                        color: selectedYear === item ? colors.primary : colors.text,
                      }}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {/* Month */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: fontSizes.FONT11, fontFamily: "Poppins_500Medium", color: colors.textSecondary, marginBottom: verticalScale(6) }}>
                  {isRTL ? "الشهر" : "Month"}
                </Text>
                <FlatList
                  data={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedMonth(item)}
                      style={{
                        height: verticalScale(40),
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: selectedMonth === item ? colors.selectedItem : "transparent",
                        borderRadius: scale(8),
                        marginHorizontal: scale(4),
                      }}
                    >
                      <Text style={{
                        fontSize: fontSizes.FONT15,
                        fontFamily: selectedMonth === item ? "Poppins_600SemiBold" : "Poppins_400Regular",
                        color: selectedMonth === item ? colors.primary : colors.text,
                      }}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {/* Day */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: fontSizes.FONT11, fontFamily: "Poppins_500Medium", color: colors.textSecondary, marginBottom: verticalScale(6) }}>
                  {isRTL ? "اليوم" : "Day"}
                </Text>
                <FlatList
                  data={Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"))}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedDay(item)}
                      style={{
                        height: verticalScale(40),
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: selectedDay === item ? colors.selectedItem : "transparent",
                        borderRadius: scale(8),
                        marginHorizontal: scale(4),
                      }}
                    >
                      <Text style={{
                        fontSize: fontSizes.FONT15,
                        fontFamily: selectedDay === item ? "Poppins_600SemiBold" : "Poppins_400Regular",
                        color: selectedDay === item ? colors.primary : colors.text,
                      }}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Success Modal ────────────────────── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
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
              backgroundColor: colors.card,
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
            {/* Success Icon Circle */}
            <View
              style={{
                width: scale(72),
                height: scale(72),
                borderRadius: scale(36),
                backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: verticalScale(16),
              }}
            >
              <LinearGradient
                colors={["#22c55e", "#16a34a"]}
                style={{
                  width: scale(52),
                  height: scale(52),
                  borderRadius: scale(26),
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="checkmark" size={scale(30)} color="#fff" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: fontSizes.FONT20,
                fontFamily: "Poppins_600SemiBold",
                color: colors.text,
                textAlign: "center",
                marginBottom: verticalScale(8),
              }}
            >
              {t("editProfile.successTitle")}
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: verticalScale(24),
                paddingHorizontal: scale(8),
              }}
            >
              {t("editProfile.successMessage")}
            </Text>

            {/* Done Button */}
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              activeOpacity={0.85}
              style={{ width: "100%" }}
            >
              <LinearGradient
                colors={["#22c55e", "#16a34a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
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
                  {t("editProfile.done")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
