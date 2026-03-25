import {
  View,
  Text,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { BlurView } from "expo-blur";
import { fontSizes, windowWidth, windowHeight } from "@/themes/app.constant";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale } from "react-native-size-matters";
import { useLanguage } from "@/context/language.context";

const SASL_BASE = "https://sasl.sba.gov.sa";

export default function AuthModal({
  setModalVisible,
}: {
  setModalVisible: (modal: boolean) => void;
}) {
  const { t, isRTL } = useLanguage();

  // ── State ─────────────────────────────────
  const [email, setEmail] = useState("rami@sajil.org");
  const [password, setPassword] = useState("NzCAoCSajil123");
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState<1 | 2>(1); // 1 = credentials, 2 = OTP
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // ── OTP Countdown ─────────────────────────
  useEffect(() => {
    if (otpTimer <= 0 || otpStep !== 2) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer, otpStep]);

  // ── Helpers ───────────────────────────────
  const otpValue = otpDigits.join("");

  const resetOTP = (clearTimer = true) => {
    setOtpDigits(["", "", "", "", "", ""]);
    if (clearTimer) setOtpTimer(0);
  };

  const getErrorMessage = (error: any, fallback: string) => {
    if (error.response) {
      const { status, data } = error.response;
      const apiMsg =
        data?.message || data?.error || data?.error_description || "";
      if (status === 401) return t("auth.invalidEmailPassword");
      if (status === 403) return t("auth.wrongOTP");
      if (status === 404) return t("auth.userNotFound");
      if (status === 429) return t("auth.tooManyAttempts");
      if (status >= 500) return t("auth.serverError");
      return apiMsg || fallback;
    }
    if (error.message?.includes("Network")) return t("auth.networkError");
    return error.message || fallback;
  };

  // ── Step 1: Send OTP ──────────────────────
  const handleSendOTP = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg(t("auth.fillAllFields"));
      return;
    }

    // If timer is still running, go back to OTP step without resending
    if (otpTimer > 0) {
      setOtpStep(2);
      setErrorMsg("");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      await axios.post(
        `${SASL_BASE}/api/v3/otpLogin`,
        { login_name: email, username: email, password },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Language": "ar",
          },
        }
      );
      setOtpStep(2);
      setOtpTimer(300);
      resetOTP(false);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (error: any) {
      setErrorMsg(getErrorMessage(error, t("auth.loginFailed")));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────
  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      setErrorMsg(t("auth.enterValidOTP"));
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const tokenResponse = await axios.post(
        `${SASL_BASE}/api/v3/auth/token`,
        {
          client_id: "5185",
          grant_type: "otp",
          otp: otpValue,
          login_name: email,
          password,
          remember_me: true,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Accept-Language": "ar",
          },
        }
      );

      const resData = tokenResponse.data?.data || tokenResponse.data;
      const token = resData.access_token;
      const refreshToken = resData.refresh_token;
      const expiresIn = resData.expires_in;

      if (!token) {
        setErrorMsg(t("auth.loginFailed"));
        return;
      }

      // Save tokens
      await SecureStore.setItemAsync("accessToken", token);
      if (refreshToken) await SecureStore.setItemAsync("refreshToken", refreshToken);
      if (expiresIn) {
        await SecureStore.setItemAsync("tokenExpiry", (Date.now() + expiresIn * 1000).toString());
      }

      // Fetch user info
      try {
        const meRes = await axios.get(`${SASL_BASE}/api/v3/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const me = meRes.data?.data || meRes.data;
        await SecureStore.setItemAsync("email", email);
        await SecureStore.setItemAsync(
          "name",
          me?.name || me?.username || email.split("@")[0]
        );
        await SecureStore.setItemAsync(
          "avatar",
          me?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=1e7bb9&color=fff`
        );
        if (me?.id) await SecureStore.setItemAsync("userId", me.id.toString());
      } catch (meErr) {
        // Non-blocking – save basic info
        await SecureStore.setItemAsync("email", email);
        await SecureStore.setItemAsync("name", email.split("@")[0]);
      }

      setModalVisible(false);
      router.push("/(tabs)");
    } catch (error: any) {
      setErrorMsg(getErrorMessage(error, t("auth.invalidOTP")));
      resetOTP(false); // Keep the timer running on wrong OTP
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────
  const handleResendOTP = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await axios.post(
        `${SASL_BASE}/api/v3/otpLogin`,
        { login_name: email, username: email, password },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Language": "ar",
          },
        }
      );
      setOtpTimer(300);
      resetOTP(false);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (error: any) {
      setErrorMsg(getErrorMessage(error, t("auth.resendFailed")));
    } finally {
      setLoading(false);
    }
  };

  // ── Navigate to Registration ──────────────
  const handleCreateAccount = () => {
    // Close modal first (same pattern as successful OTP login),
    // then navigate after a short delay so the modal fully unmounts
    setModalVisible(false);
    setTimeout(() => {
      router.push("/(routes)/certification" as any);
    }, 200);
  };

  // ── OTP Input Handler ─────────────────────
  const handleOtpChange = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, "");
    if (numericText.length <= 1) {
      const newDigits = [...otpDigits];
      newDigits[index] = numericText;
      setOtpDigits(newDigits);
      if (numericText && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // ── Colors ────────────────────────────────
  const colors = {
    primary: "#1e7bb9",
    primaryDark: "#0f64a7",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    inputBg: "#f8f9fa",
    error: "#ef4444",
    white: "#ffffff",
  };

  // ── Render ────────────────────────────────
  return (
    <BlurView
      style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.6)" }}
      intensity={100}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ width: "100%", alignItems: "center" }}
      >
        <Pressable
          style={{
            width: windowWidth(420),
            maxHeight: windowHeight(650),
            marginHorizontal: windowWidth(50),
            backgroundColor: colors.white,
            borderRadius: scale(24),
            paddingVertical: verticalScale(28),
            paddingHorizontal: scale(24),
            direction: isRTL ? "rtl" : "ltr",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 10,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header Icon ───────────────────── */}
            <View style={{ alignItems: "center", marginBottom: verticalScale(6) }}>
              <View
                style={{
                  width: scale(56),
                  height: scale(56),
                  borderRadius: scale(28),
                  backgroundColor: "#e8f4f8",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: verticalScale(12),
                }}
              >
                <Ionicons
                  name={otpStep === 1 ? "log-in-outline" : "shield-checkmark-outline"}
                  size={scale(28)}
                  color={colors.primary}
                />
              </View>
            </View>

            {/* ── Title ─────────────────────────── */}
            <Text
              style={{
                fontSize: fontSizes.FONT28,
                fontFamily: "Poppins_700Bold",
                color: colors.text,
                textAlign: "center",
                marginBottom: verticalScale(4),
              }}
            >
              {otpStep === 1 ? t("auth.otpLogin") : t("auth.verifyOTP")}
            </Text>
            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: verticalScale(20),
                lineHeight: fontSizes.FONT14 * 1.5,
              }}
            >
              {otpStep === 1 ? t("auth.enterCredentials") : t("auth.enterOTPCode")}
            </Text>

            {/* ── Error Banner ──────────────────── */}
            {errorMsg !== "" && (
              <View
                style={{
                  backgroundColor: "rgba(239,68,68,0.08)",
                  borderRadius: scale(10),
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.2)",
                  padding: scale(12),
                  marginBottom: verticalScale(16),
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="alert-circle"
                  size={scale(18)}
                  color={colors.error}
                  style={{ marginRight: isRTL ? 0 : scale(8), marginLeft: isRTL ? scale(8) : 0 }}
                />
                <Text
                  style={{
                    fontSize: fontSizes.FONT12,
                    fontFamily: "Poppins_400Regular",
                    color: colors.error,
                    flex: 1,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* ═══ STEP 1: Email + Password ═══════ */}
            {otpStep === 1 && (
              <>
                {/* Email */}
                <View style={{ marginBottom: verticalScale(14) }}>
                  <Text
                    style={{
                      fontSize: fontSizes.FONT13,
                      fontFamily: "Poppins_500Medium",
                      color: colors.text,
                      marginBottom: verticalScale(6),
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {t("auth.email")}
                  </Text>
                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      borderRadius: scale(12),
                      backgroundColor: colors.inputBg,
                    }}
                  >
                    <View style={{ paddingLeft: isRTL ? 0 : scale(12), paddingRight: isRTL ? scale(12) : 0 }}>
                      <Ionicons name="mail-outline" size={scale(18)} color={colors.textSecondary} />
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={(t) => { setEmail(t); setErrorMsg(""); }}
                      placeholder={t("auth.enterEmail")}
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={{
                        flex: 1,
                        height: verticalScale(48),
                        paddingHorizontal: scale(10),
                        fontSize: fontSizes.FONT15,
                        fontFamily: "Poppins_400Regular",
                        color: colors.text,
                        textAlign: isRTL ? "right" : "left",
                      }}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={{ marginBottom: verticalScale(20) }}>
                  <Text
                    style={{
                      fontSize: fontSizes.FONT13,
                      fontFamily: "Poppins_500Medium",
                      color: colors.text,
                      marginBottom: verticalScale(6),
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {t("auth.password")}
                  </Text>
                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      borderRadius: scale(12),
                      backgroundColor: colors.inputBg,
                    }}
                  >
                    <View style={{ paddingLeft: isRTL ? 0 : scale(12), paddingRight: isRTL ? scale(12) : 0 }}>
                      <Ionicons name="lock-closed-outline" size={scale(18)} color={colors.textSecondary} />
                    </View>
                    <TextInput
                      value={password}
                      onChangeText={(t) => { setPassword(t); setErrorMsg(""); }}
                      placeholder={t("auth.enterPassword")}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showPassword}
                      style={{
                        flex: 1,
                        height: verticalScale(48),
                        paddingHorizontal: scale(10),
                        fontSize: fontSizes.FONT15,
                        fontFamily: "Poppins_400Regular",
                        color: colors.text,
                        textAlign: isRTL ? "right" : "left",
                      }}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ paddingHorizontal: scale(12) }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={scale(20)}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  onPress={handleSendOTP}
                  disabled={loading}
                  activeOpacity={0.8}
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
                      opacity: loading ? 0.7 : 1,
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
                        {t("auth.sendOTP")}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: verticalScale(20),
                  }}
                >
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  <Text
                    style={{
                      marginHorizontal: scale(14),
                      fontSize: fontSizes.FONT12,
                      fontFamily: "Poppins_400Regular",
                      color: colors.textSecondary,
                    }}
                  >
                    {t("auth.or")}
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>

                {/* Create Account Button */}
                <TouchableOpacity
                  onPress={handleCreateAccount}
                  activeOpacity={0.8}
                  style={{
                    height: verticalScale(50),
                    borderRadius: scale(12),
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT16,
                      fontFamily: "Poppins_600SemiBold",
                      color: colors.primary,
                    }}
                  >
                    {t("auth.createNewAccount")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ═══ STEP 2: OTP Verification ═══════ */}
            {otpStep === 2 && (
              <>
                {/* Back to login */}
                <TouchableOpacity
                  onPress={() => {
                    setOtpStep(1);
                    resetOTP(false);
                    setErrorMsg("");
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    alignSelf: isRTL ? "flex-end" : "flex-start",
                    marginBottom: verticalScale(16),
                    paddingVertical: verticalScale(8),
                    paddingHorizontal: scale(14),
                    borderRadius: scale(10),
                    backgroundColor: "#e8f4f8",
                  }}
                >
                  <Ionicons
                    name={isRTL ? "arrow-forward" : "arrow-back"}
                    size={scale(15)}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: fontSizes.FONT13,
                      fontFamily: "Poppins_600SemiBold",
                      color: colors.primary,
                      marginLeft: isRTL ? 0 : scale(6),
                      marginRight: isRTL ? scale(6) : 0,
                    }}
                  >
                    {t("auth.backToLogin")}
                  </Text>
                </TouchableOpacity>

                {/* OTP sent info */}
                <View
                  style={{
                    backgroundColor: "#e8f4f8",
                    borderRadius: scale(10),
                    padding: scale(12),
                    marginBottom: verticalScale(16),
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="information-circle"
                    size={scale(18)}
                    color={colors.primary}
                    style={{ marginRight: isRTL ? 0 : scale(8), marginLeft: isRTL ? scale(8) : 0 }}
                  />
                  <Text
                    style={{
                      fontSize: fontSizes.FONT12,
                      fontFamily: "Poppins_400Regular",
                      color: colors.primary,
                      flex: 1,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {t("auth.otpSent")}
                  </Text>
                </View>

                {/* OTP Inputs */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: scale(4),
                    marginBottom: verticalScale(20),
                  }}
                >
                  {otpDigits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (otpInputRefs.current[index] = ref)}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, index)
                      }
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={{
                        width: scale(36),
                        height: scale(44),
                        borderWidth: 1.5,
                        borderColor: digit ? colors.primary : colors.border,
                        borderRadius: scale(8),
                        fontSize: fontSizes.FONT18,
                        fontFamily: "Poppins_600SemiBold",
                        color: colors.text,
                        backgroundColor: digit ? "#e8f4f8" : colors.white,
                        textAlign: "center",
                      }}
                    />
                  ))}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={handleVerifyOTP}
                  disabled={loading || otpValue.length !== 6}
                  activeOpacity={0.8}
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
                      opacity: loading || otpValue.length !== 6 ? 0.5 : 1,
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
                        {t("auth.verifyOTPButton")}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Resend OTP */}
                <View style={{ marginTop: verticalScale(16), alignItems: "center" }}>
                  {otpTimer > 0 ? (
                    <Text
                      style={{
                        fontSize: fontSizes.FONT13,
                        fontFamily: "Poppins_400Regular",
                        color: colors.textSecondary,
                        textAlign: "center",
                      }}
                    >
                      {t("auth.resendIn")}{" "}
                      <Text style={{ fontFamily: "Poppins_600SemiBold", color: colors.primary }}>
                        {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}
                      </Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={loading}
                      style={{ paddingVertical: verticalScale(6) }}
                    >
                      <Text
                        style={{
                          fontSize: fontSizes.FONT13,
                          fontFamily: "Poppins_500Medium",
                          color: colors.primary,
                          textDecorationLine: "underline",
                        }}
                      >
                        {t("auth.resendOTP")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </BlurView>
  );
}
