import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  FlatList,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "@/components/common/app-header";
import { scale, verticalScale } from "react-native-size-matters";
import { fontSizes } from "@/themes/app.constant";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { router } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const SASL_BASE = "https://sasl.sba.gov.sa";

type IdentityType = "sa" | "foreign";
type Gender = "male" | "female" | null;
type Degree = "law" | "shariah" | null;

interface FormErrors {
  [key: string]: string;
}

interface UserInfo {
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  familyName: string;
  sexCode: number | null; // 1 = Male, 2 = Female
}

// Extracted outside so React keeps a stable reference across renders (prevents keyboard dismiss)
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  error,
  rightIcon,
  editable = true,
  colors,
  isRTL,
  isDark,
}: any) => (
  <View style={{ marginBottom: verticalScale(16) }}>
    <Text
      style={{
        fontSize: fontSizes.FONT13,
        fontFamily: "Poppins_500Medium",
        color: colors.text,
        marginBottom: verticalScale(6),
        textAlign: isRTL ? "right" : "left",
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: error ? colors.error : colors.inputBorder,
        borderRadius: scale(12),
        backgroundColor: editable ? colors.inputBg : (isDark ? "#252839" : "#f0f0f0"),
        overflow: "hidden",
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        style={{
          flex: 1,
          height: verticalScale(48),
          paddingHorizontal: scale(14),
          fontSize: fontSizes.FONT15,
          fontFamily: "Poppins_400Regular",
          color: colors.text,
          textAlign: isRTL ? "right" : "left",
          writingDirection: isRTL ? "rtl" : "ltr",
        }}
      />
      {rightIcon}
    </View>
    {error ? (
      <Text
        style={{
          fontSize: fontSizes.FONT11,
          fontFamily: "Poppins_400Regular",
          color: colors.error,
          marginTop: verticalScale(4),
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {error}
      </Text>
    ) : null}
  </View>
);

export default function CertificationScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const isDark = theme.dark;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Step 0: Personal Data ─────────────────
  const [identityType, setIdentityType] = useState<IdentityType>("sa");
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showForeignInfoModal, setShowForeignInfoModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState("1995");
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [selectedDay, setSelectedDay] = useState("01");

  // ── Step 1: Verification ──────────────────
  const [verificationCode, setVerificationCode] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [degree, setDegree] = useState<Degree>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // ── Step 2: Account Data ──────────────────
  const [email, setEmail] = useState("");
  const [repeatEmail, setRepeatEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  // ── Network Logger ───────────────────────
  const [netLogs, setNetLogs] = useState<any[]>([]);
  const [showNetLogger, setShowNetLogger] = useState(false);
  const logIdRef = useRef(0);

  const addLog = (entry: any) => {
    setNetLogs((prev) => [entry, ...prev].slice(0, 30));
  };

  const loggedAxios = async (config: { method: string; url: string; data?: any; headers?: any }) => {
    const id = ++logIdRef.current;
    const start = Date.now();
    const time = new Date().toLocaleTimeString();
    try {
      const res = config.method === "GET"
        ? await axios.get(config.url, { headers: config.headers })
        : await axios.post(config.url, config.data, { headers: config.headers });
      const duration = Date.now() - start;
      addLog({ id, time, method: config.method, url: config.url, status: res.status, reqBody: config.data, resBody: res.data, duration });
      return res;
    } catch (catchedError: any) {
      const duration = Date.now() - start;
      const errStatus = catchedError?.response?.status;
      const errData = catchedError?.response?.data;
      const errMsg = catchedError?.message || "Unknown error";
      addLog({ id, time, method: config.method, url: config.url, status: errStatus, reqBody: config.data, resBody: errData, error: errMsg, duration });
      throw catchedError;
    }
  };

  const isForeign = identityType === "foreign";

  const reasonOptions = [
    { text: t("cert.reasons.professionalDev"), value: "professional_development" },
    { text: t("cert.reasons.promotion"), value: "promotion" },
    { text: t("cert.reasons.jobRequirement"), value: "job_requirement" },
    { text: t("cert.reasons.jobPreference"), value: "job_preference" },
    { text: t("cert.reasons.jobSearch"), value: "job_search" },
    { text: t("cert.reasons.other"), value: "other" },
  ];

  // ── Colors ────────────────────────────────
  const colors = {
    bg: isDark ? "#0f1117" : "#f8fafb",
    card: isDark ? "#1a1d27" : "#ffffff",
    border: isDark ? "#2a2d3a" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    primary: "#1e7bb9",
    primaryLight: "#e8f4f8",
    primaryDark: "#0f64a7",
    error: "#ef4444",
    success: "#22c55e",
    inputBg: isDark ? "#1e2130" : "#f8f9fa",
    inputBorder: isDark ? "#2a2d3a" : "#e2e8f0",
    inactiveRadio: isDark ? "#3a3d4a" : "#cbd5e1",
  };

  const stepTitles = [
    t("cert.personalData"),
    t("cert.verification"),
    t("cert.accountData"),
  ];

  // ── Validation ────────────────────────────

  const validateStep0 = (): boolean => {
    const e: FormErrors = {};
    if (!nationalId.trim()) e.nationalId = t("cert.errors.nationalIdRequired");
    else if (!isForeign && !/^\d+$/.test(nationalId))
      e.nationalId = t("cert.errors.nationalIdNumeric");
    if (!isForeign && !birthDate.trim())
      e.birthDate = t("cert.errors.birthDateRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!isForeign && !verificationCode.trim())
      e.verificationCode = t("cert.errors.codeRequired");
    if (!gender) e.gender = t("cert.errors.genderRequired");
    if (!degree) e.degree = t("cert.errors.degreeRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRx = /^\d{7,16}$/;
    if (!email.trim()) e.email = t("cert.errors.emailRequired");
    else if (!emailRx.test(email)) e.email = t("cert.errors.emailInvalid");
    if (!repeatEmail.trim()) e.repeatEmail = t("cert.errors.repeatEmailRequired");
    else if (email !== repeatEmail) e.repeatEmail = t("cert.errors.emailsMismatch");
    if (!password.trim()) e.password = t("cert.errors.passwordRequired");
    else if (password.length < 8) e.password = t("cert.errors.passwordMin");
    if (!repeatPassword.trim())
      e.repeatPassword = t("cert.errors.repeatPasswordRequired");
    else if (password !== repeatPassword)
      e.repeatPassword = t("cert.errors.passwordsMismatch");
    if (!phone.trim()) e.phone = t("cert.errors.phoneRequired");
    else if (!phoneRx.test(phone)) e.phone = t("cert.errors.phoneInvalid");
    if (!reason) e.reason = t("cert.errors.reasonRequired");
    if (!termsAccepted) e.terms = t("cert.errors.termsRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── API: Step 0 → Check National ID ───────
  const handleStep0 = async () => {
    setErrorMessage("");
    if (!validateStep0()) return;
    setLoading(true);
    try {
      if (isForeign) {
        // Foreign: GET user info by national ID
        const res = await loggedAxios({
          method: "GET",
          url: `${SASL_BASE}/api/v2/yaqeen/userInfo/${nationalId}`,
          headers: { Accept: "application/json", "Accept-Language": "ar" },
        });
        const data = res.data?.data || res.data;
        // Parse foreign user info
        const nameParts = (data?.user_name || "").split(" ");
        setUserInfo({
          firstName: nameParts[0] || "",
          fatherName: nameParts[1] || "",
          grandFatherName: "",
          familyName: nameParts[nameParts.length - 1] || "",
          sexCode: null,
        });
        setCurrentStep(1);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        // Saudi: POST check ID → triggers Absher OTP
        await loggedAxios({
          method: "POST",
          url: `${SASL_BASE}/api/v2/yaqeen/checkID`,
          data: { nationalId, dateOfBirth: birthDate },
          headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Language": "ar" },
        });
        setCurrentStep(1);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    } catch (error: any) {
      const isNetwork = !error.response && error.message?.includes("Network");
      if (isNetwork) {
        setErrorMessage("خطأ في الاتصال بالشبكة. يرجى المحاولة مرة أخرى.");
      } else {
        setErrorMessage("رقم الهوية غير صحيح/تاريخ الميلاد غير صحيح");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── API: Step 1 → Verify & Get User Info ──
  const handleStep1 = async () => {
    setErrorMessage("");
    if (!validateStep1()) return;
    setLoading(true);
    try {
      if (!isForeign) {
        // Saudi: Verify Absher code → get personal data
        const res = await loggedAxios({
          method: "POST",
          url: `${SASL_BASE}/api/v2/yaqeen/userInfo`,
          data: { nationalId, code: verificationCode },
          headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Language": "ar" },
        });
        const data = res.data?.data?.data || res.data?.data || res.data;
        setUserInfo({
          firstName: data?.firstName || "",
          fatherName: data?.fatherName || "",
          grandFatherName: data?.grandFatherName || "",
          familyName: data?.familyName || "",
          sexCode: data?.sexCode || null,
        });
        // Auto-set gender from API response
        if (data?.sexCode === 1) setGender("male");
        else if (data?.sexCode === 2) setGender("female");
      }
      setCurrentStep(2);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      const apiMsg = error.response?.data?.message || error.response?.data?.error;
      if (error.response?.status === 403 || error.response?.status === 400) {
        setErrorMessage(apiMsg || t("cert.errors.invalidCode"));
      } else {
        setErrorMessage(apiMsg || t("cert.errors.verificationFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── API: Step 2 → Create Account ──────────
  const handleSubmit = async () => {
    setErrorMessage("");
    if (!validateStep2()) return;
    setLoading(true);
    try {
      // Build full name for lastname
      const lastName = [
        userInfo?.fatherName,
        userInfo?.grandFatherName,
        userInfo?.familyName,
      ]
        .filter(Boolean)
        .join(" ");

      const res = await loggedAxios({
        method: "POST",
        url: `${SASL_BASE}/api/v3/public/users`,
        data: {
          firstname: userInfo?.firstName || "",
          lastname: lastName || "",
          sub_sso_id: nationalId,
          email,
          password,
          phone: `${countryCode}${phone}`,
          gender: gender || "male",
          reason,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": "ar",
        },
      });

      const data = res.data?.data || res.data;
      const tokenData = data?.token || data;
      const accessToken = tokenData?.access_token;
      const refreshToken = tokenData?.refresh_token;
      const expiresIn = tokenData?.expires_in;

      if (accessToken) {
        await SecureStore.setItemAsync("accessToken", accessToken);
      }
      if (refreshToken) {
        await SecureStore.setItemAsync("refreshToken", refreshToken);
      }
      if (expiresIn) {
        await SecureStore.setItemAsync(
          "tokenExpiry",
          (Date.now() + expiresIn * 1000).toString()
        );
      }

      // Save user info
      await SecureStore.setItemAsync("email", email);
      await SecureStore.setItemAsync(
        "name",
        `${userInfo?.firstName || ""} ${userInfo?.familyName || ""}`.trim() || email
      );
      await SecureStore.setItemAsync(
        "avatar",
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          userInfo?.firstName || email
        )}&background=1e7bb9&color=fff`
      );

      // Fetch user ID
      if (accessToken) {
        try {
          const meRes = await loggedAxios({
            method: "GET",
            url: `${SASL_BASE}/api/v3/me`,
            headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
          });
          const me = meRes.data?.data || meRes.data;
          if (me?.id) await SecureStore.setItemAsync("userId", me.id.toString());
        } catch (e) {
        }
      }

      Alert.alert(t("cert.success"), t("cert.registrationSuccess"), [
        {
          text: t("common.confirm"),
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error: any) {
      const apiData = error.response?.data;
      const apiMsg = apiData?.message || apiData?.error;

      // Check for duplicate email
      if (apiData?.error_fields?.email?.duplicate) {
        setErrorMessage(t("cert.errors.duplicateEmail"));
      } else {
        setErrorMessage(apiMsg || t("cert.errors.submitFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setErrorMessage("");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const openQuadraBayLink = async () => {
    const url = "https://sba.quadrabay.com/authentication/login";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open the link.");
      }
    } catch (openErr) {
      Alert.alert("Error", "Unable to open the link.");
    }
  };

  // ── Reusable Components ───────────────────

  const StepIndicator = () => (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: verticalScale(18),
        paddingHorizontal: scale(20),
      }}
    >
      {[0, 1, 2].map((step) => (
        <React.Fragment key={step}>
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: scale(36),
                height: scale(36),
                borderRadius: scale(18),
                backgroundColor:
                  currentStep >= step ? colors.primary : colors.inactiveRadio,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {currentStep > step ? (
                <Ionicons name="checkmark" size={scale(18)} color="#fff" />
              ) : (
                <Text
                  style={{
                    color: currentStep >= step ? "#fff" : colors.textSecondary,
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: fontSizes.FONT14,
                  }}
                >
                  {step + 1}
                </Text>
              )}
            </View>
            <Text
              style={{
                fontSize: fontSizes.FONT10,
                fontFamily:
                  currentStep >= step
                    ? "Poppins_600SemiBold"
                    : "Poppins_400Regular",
                color: currentStep >= step ? colors.primary : colors.textSecondary,
                marginTop: verticalScale(4),
                textAlign: "center",
                maxWidth: scale(80),
              }}
              numberOfLines={1}
            >
              {stepTitles[step]}
            </Text>
          </View>
          {step < 2 && (
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor:
                  currentStep > step ? colors.primary : colors.inactiveRadio,
                marginHorizontal: scale(4),
                marginBottom: verticalScale(16),
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const RadioBtn = ({
    selected,
    label,
    onPress,
  }: {
    selected: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(14),
        borderRadius: scale(10),
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.inputBorder,
        backgroundColor: selected
          ? isDark
            ? "rgba(30,123,185,0.12)"
            : colors.primaryLight
          : colors.inputBg,
        marginBottom: verticalScale(8),
        flex: 1,
      }}
    >
      <View
        style={{
          width: scale(20),
          height: scale(20),
          borderRadius: scale(10),
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.inactiveRadio,
          justifyContent: "center",
          alignItems: "center",
          marginRight: isRTL ? 0 : scale(10),
          marginLeft: isRTL ? scale(10) : 0,
        }}
      >
        {selected && (
          <View
            style={{
              width: scale(10),
              height: scale(10),
              borderRadius: scale(5),
              backgroundColor: colors.primary,
            }}
          />
        )}
      </View>
      <Text
        style={{
          fontSize: fontSizes.FONT14,
          fontFamily: selected ? "Poppins_500Medium" : "Poppins_400Regular",
          color: selected ? colors.primary : colors.text,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );


  const SectionTitle = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <View style={{ marginBottom: verticalScale(20) }}>
      <Text
        style={{
          fontSize: fontSizes.FONT22,
          fontFamily: "Poppins_700Bold",
          color: colors.text,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: fontSizes.FONT13,
            fontFamily: "Poppins_400Regular",
            color: colors.textSecondary,
            marginTop: verticalScale(4),
            textAlign: isRTL ? "right" : "left",
            lineHeight: fontSizes.FONT13 * 1.5,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const ErrorBanner = () =>
    errorMessage ? (
      <View
        style={{
          backgroundColor: "rgba(239,68,68,0.08)",
          borderRadius: scale(10),
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.2)",
          padding: scale(12),
          marginBottom: verticalScale(12),
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
        }}
      >
        <Ionicons
          name="alert-circle"
          size={scale(18)}
          color={colors.error}
          style={{
            marginRight: isRTL ? 0 : scale(8),
            marginLeft: isRTL ? scale(8) : 0,
          }}
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
          {errorMessage}
        </Text>
      </View>
    ) : null;

  const GradientButton = ({
    onPress,
    label,
    disabled,
  }: {
    onPress: () => void;
    label: string;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{ marginTop: verticalScale(8) }}
    >
      <LinearGradient
        colors={["#1e7bb9", "#0f64a7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: verticalScale(50),
          borderRadius: scale(12),
          justifyContent: "center",
          alignItems: "center",
          opacity: disabled || loading ? 0.5 : 1,
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
            {label}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const BackButton = () => (
    <TouchableOpacity
      onPress={handlePrevStep}
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        marginBottom: verticalScale(16),
        alignSelf: isRTL ? "flex-end" : "flex-start",
        padding: scale(4),
      }}
    >
      <Ionicons
        name={isRTL ? "chevron-forward" : "chevron-back"}
        size={scale(18)}
        color={colors.primary}
      />
      <Text
        style={{
          fontSize: fontSizes.FONT14,
          fontFamily: "Poppins_500Medium",
          color: colors.primary,
          marginLeft: isRTL ? 0 : scale(4),
          marginRight: isRTL ? scale(4) : 0,
        }}
      >
        {t("cert.previous")}
      </Text>
    </TouchableOpacity>
  );

  const FieldLabel = ({ text }: { text: string }) => (
    <Text
      style={{
        fontSize: fontSizes.FONT13,
        fontFamily: "Poppins_500Medium",
        color: colors.text,
        marginBottom: verticalScale(8),
        textAlign: isRTL ? "right" : "left",
      }}
    >
      {text}
    </Text>
  );

  // ── Step 0: Personal Data ─────────────────

  const renderStep0 = () => (
    <View>
      <SectionTitle
        title={t("cert.personalData")}
        subtitle={t("cert.personalDataSubtitle")}
      />

      <FieldLabel text={t("cert.identityType")} />
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          gap: scale(10),
          marginBottom: verticalScale(16),
        }}
      >
        <RadioBtn
          selected={identityType === "sa"}
          label={t("cert.saudiCitizen")}
          onPress={() => setIdentityType("sa")}
        />
        <RadioBtn
          selected={identityType === "foreign"}
          label={t("cert.foreign")}
          onPress={() => {
            setIdentityType("foreign");
            setShowForeignInfoModal(true);
          }}
        />
      </View>

      <InputField
        colors={colors} isRTL={isRTL} isDark={isDark}
        label={t("cert.nationalId")}
        value={nationalId}
        onChangeText={(v: string) => {
          setNationalId(v);
          setErrors((p: FormErrors) => ({ ...p, nationalId: "" }));
        }}
        placeholder="0123456789"
        keyboardType={isForeign ? "default" : "numeric"}
        error={errors.nationalId}
      />

      {!isForeign && (
        <View style={{ marginBottom: verticalScale(16) }}>
          <Text
            style={{
              fontSize: fontSizes.FONT13,
              fontFamily: "Poppins_500Medium",
              color: colors.text,
              marginBottom: verticalScale(6),
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {t("cert.birthDate")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: errors.birthDate ? colors.error : colors.inputBorder,
              borderRadius: scale(12),
              backgroundColor: colors.inputBg,
              height: verticalScale(48),
              paddingHorizontal: scale(14),
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={scale(18)}
              color={birthDate ? colors.primary : colors.textSecondary}
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
                color: birthDate ? colors.text : colors.textSecondary,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {birthDate || t("cert.selectBirthDate")}
            </Text>
          </TouchableOpacity>
          {errors.birthDate ? (
            <Text
              style={{
                fontSize: fontSizes.FONT11,
                fontFamily: "Poppins_400Regular",
                color: colors.error,
                marginTop: verticalScale(4),
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {errors.birthDate}
            </Text>
          ) : null}
        </View>
      )}

      <ErrorBanner />
      <GradientButton onPress={handleStep0} label={t("cert.check")} />
    </View>
  );

  // ── Step 1: Verification ──────────────────

  const renderStep1 = () => (
    <View>
      <BackButton />
      <SectionTitle
        title={t("cert.verification")}
        subtitle={t("cert.verificationSubtitle")}
      />

      {/* Absher code for Saudi users */}
      {!isForeign && (
        <InputField
          colors={colors} isRTL={isRTL} isDark={isDark}
          label={t("cert.absherCode")}
          value={verificationCode}
          onChangeText={(v: string) => {
            setVerificationCode(v);
            setErrors((p: FormErrors) => ({ ...p, verificationCode: "" }));
          }}
          placeholder="0123"
          keyboardType="numeric"
          error={errors.verificationCode}
        />
      )}

      {/* Display retrieved user info if available */}
      {userInfo && (
        <View
          style={{
            backgroundColor: isDark ? "rgba(30,123,185,0.08)" : "#e8f4f8",
            borderRadius: scale(12),
            padding: scale(14),
            marginBottom: verticalScale(16),
            borderWidth: 1,
            borderColor: isDark ? "rgba(30,123,185,0.2)" : "#b8dff0",
          }}
        >
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              marginBottom: verticalScale(8),
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={scale(20)}
              color={colors.primary}
              style={{
                marginRight: isRTL ? 0 : scale(8),
                marginLeft: isRTL ? scale(8) : 0,
              }}
            />
            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_600SemiBold",
                color: colors.primary,
              }}
            >
              {t("cert.retrievedInfo")}
            </Text>
          </View>
          <Text
            style={{
              fontSize: fontSizes.FONT14,
              fontFamily: "Poppins_500Medium",
              color: colors.text,
              textAlign: isRTL ? "right" : "left",
              lineHeight: fontSizes.FONT14 * 1.6,
            }}
          >
            {`${userInfo.firstName} ${userInfo.fatherName} ${userInfo.grandFatherName} ${userInfo.familyName}`.trim()}
          </Text>
        </View>
      )}

      {/* Gender */}
      <FieldLabel text={t("cert.gender")} />
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          gap: scale(10),
          marginBottom: verticalScale(4),
        }}
      >
        <RadioBtn
          selected={gender === "male"}
          label={t("cert.male")}
          onPress={() => setGender("male")}
        />
        <RadioBtn
          selected={gender === "female"}
          label={t("cert.female")}
          onPress={() => setGender("female")}
        />
      </View>
      {errors.gender ? (
        <Text
          style={{
            fontSize: fontSizes.FONT11,
            color: colors.error,
            marginBottom: verticalScale(12),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {errors.gender}
        </Text>
      ) : null}

      {/* Degree Type */}
      <FieldLabel text={t("cert.degreeType")} />
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          gap: scale(10),
          marginBottom: verticalScale(4),
        }}
      >
        <RadioBtn
          selected={degree === "law"}
          label={t("cert.law")}
          onPress={() => setDegree("law")}
        />
        <RadioBtn
          selected={degree === "shariah"}
          label={t("cert.shariah")}
          onPress={() => setDegree("shariah")}
        />
      </View>
      {errors.degree ? (
        <Text
          style={{
            fontSize: fontSizes.FONT11,
            color: colors.error,
            marginBottom: verticalScale(12),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {errors.degree}
        </Text>
      ) : null}

      <ErrorBanner />
      <GradientButton onPress={handleStep1} label={t("cert.check")} />
    </View>
  );

  // ── Step 2: Account Data ──────────────────

  const renderStep2 = () => (
    <View>
      <BackButton />
      <SectionTitle
        title={t("cert.accountData")}
        subtitle={t("cert.accountDataSubtitle")}
      />

      {/* Display name (read-only) if available */}
      {userInfo && (
        <InputField
          colors={colors} isRTL={isRTL} isDark={isDark}
          label={t("cert.name")}
          value={`${userInfo.firstName} ${userInfo.fatherName} ${userInfo.grandFatherName} ${userInfo.familyName}`.trim()}
          onChangeText={() => {}}
          placeholder=""
          editable={false}
        />
      )}

      <InputField
        colors={colors} isRTL={isRTL} isDark={isDark}
        label={t("cert.email")}
        value={email}
        onChangeText={(v: string) => {
          setEmail(v);
          setErrors((p: FormErrors) => ({ ...p, email: "" }));
        }}
        placeholder="email@example.com"
        keyboardType="email-address"
        error={errors.email}
      />
      <InputField
        colors={colors} isRTL={isRTL} isDark={isDark}
        label={t("cert.repeatEmail")}
        value={repeatEmail}
        onChangeText={(v: string) => {
          setRepeatEmail(v);
          setErrors((p: FormErrors) => ({ ...p, repeatEmail: "" }));
        }}
        placeholder="email@example.com"
        keyboardType="email-address"
        error={errors.repeatEmail}
      />
      <InputField
        colors={colors} isRTL={isRTL} isDark={isDark}
        label={t("cert.password")}
        value={password}
        onChangeText={(v: string) => {
          setPassword(v);
          setErrors((p: FormErrors) => ({ ...p, password: "" }));
        }}
        placeholder="••••••••"
        secureTextEntry={!showPassword}
        error={errors.password}
        rightIcon={
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={{ paddingHorizontal: scale(14) }}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={scale(20)}
              color={colors.textSecondary}
            />
          </Pressable>
        }
      />
      <InputField
        colors={colors} isRTL={isRTL} isDark={isDark}
        label={t("cert.repeatPassword")}
        value={repeatPassword}
        onChangeText={(v: string) => {
          setRepeatPassword(v);
          setErrors((p: FormErrors) => ({ ...p, repeatPassword: "" }));
        }}
        placeholder="••••••••"
        secureTextEntry={!showRepeatPassword}
        error={errors.repeatPassword}
        rightIcon={
          <Pressable
            onPress={() => setShowRepeatPassword(!showRepeatPassword)}
            style={{ paddingHorizontal: scale(14) }}
          >
            <Ionicons
              name={showRepeatPassword ? "eye-off-outline" : "eye-outline"}
              size={scale(20)}
              color={colors.textSecondary}
            />
          </Pressable>
        }
      />

      {/* Phone Number */}
      <FieldLabel text={t("cert.mobileNumber")} />
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          gap: scale(10),
          marginBottom: errors.phone ? verticalScale(2) : verticalScale(16),
        }}
      >
        <View
          style={{
            width: scale(90),
            borderWidth: 1.5,
            borderColor: colors.inputBorder,
            borderRadius: scale(12),
            backgroundColor: colors.inputBg,
            justifyContent: "center",
            alignItems: "center",
            height: verticalScale(48),
          }}
        >
          <TextInput
            value={countryCode}
            onChangeText={setCountryCode}
            keyboardType="phone-pad"
            style={{
              fontSize: fontSizes.FONT15,
              fontFamily: "Poppins_500Medium",
              color: colors.text,
              textAlign: "center",
            }}
          />
        </View>
        <View
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: errors.phone ? colors.error : colors.inputBorder,
            borderRadius: scale(12),
            backgroundColor: colors.inputBg,
            height: verticalScale(48),
          }}
        >
          <TextInput
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setErrors((p) => ({ ...p, phone: "" }));
            }}
            placeholder="1234567890"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            style={{
              flex: 1,
              paddingHorizontal: scale(14),
              fontSize: fontSizes.FONT15,
              fontFamily: "Poppins_400Regular",
              color: colors.text,
              textAlign: isRTL ? "right" : "left",
            }}
          />
        </View>
      </View>
      {errors.phone ? (
        <Text
          style={{
            fontSize: fontSizes.FONT11,
            color: colors.error,
            marginBottom: verticalScale(12),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {errors.phone}
        </Text>
      ) : null}

      {/* Reason Dropdown */}
      <FieldLabel text={t("cert.reasonForJoining")} />
      <TouchableOpacity
        onPress={() => setShowReasonPicker(!showReasonPicker)}
        activeOpacity={0.7}
        style={{
          borderWidth: 1.5,
          borderColor: errors.reason ? colors.error : colors.inputBorder,
          borderRadius: scale(12),
          backgroundColor: colors.inputBg,
          height: verticalScale(48),
          paddingHorizontal: scale(14),
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: showReasonPicker ? 0 : verticalScale(8),
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.FONT15,
            fontFamily: "Poppins_400Regular",
            color: reason ? colors.text : colors.textSecondary,
            flex: 1,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {reason
            ? reasonOptions.find((o) => o.value === reason)?.text
            : t("cert.selectReason")}
        </Text>
        <Ionicons
          name={showReasonPicker ? "chevron-up" : "chevron-down"}
          size={scale(18)}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {showReasonPicker && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.inputBorder,
            borderRadius: scale(12),
            backgroundColor: colors.card,
            marginBottom: verticalScale(8),
            marginTop: verticalScale(4),
            overflow: "hidden",
          }}
        >
          {reasonOptions.map((option, idx) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                setReason(option.value);
                setShowReasonPicker(false);
                setErrors((p) => ({ ...p, reason: "" }));
              }}
              style={{
                paddingVertical: verticalScale(12),
                paddingHorizontal: scale(16),
                backgroundColor:
                  reason === option.value
                    ? isDark
                      ? "rgba(30,123,185,0.12)"
                      : colors.primaryLight
                    : "transparent",
                borderBottomWidth: idx < reasonOptions.length - 1 ? 1 : 0,
                borderBottomColor: colors.inputBorder,
              }}
            >
              <Text
                style={{
                  fontSize: fontSizes.FONT14,
                  fontFamily:
                    reason === option.value
                      ? "Poppins_500Medium"
                      : "Poppins_400Regular",
                  color: reason === option.value ? colors.primary : colors.text,
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {errors.reason ? (
        <Text
          style={{
            fontSize: fontSizes.FONT11,
            color: colors.error,
            marginBottom: verticalScale(8),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {errors.reason}
        </Text>
      ) : null}

      {/* Terms & Conditions */}
      <TouchableOpacity
        onPress={() => setTermsAccepted(!termsAccepted)}
        activeOpacity={0.7}
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "flex-start",
          marginTop: verticalScale(8),
          marginBottom: verticalScale(16),
        }}
      >
        <View
          style={{
            width: scale(22),
            height: scale(22),
            borderRadius: scale(6),
            borderWidth: 2,
            borderColor: errors.terms
              ? colors.error
              : termsAccepted
              ? colors.primary
              : colors.inactiveRadio,
            backgroundColor: termsAccepted ? colors.primary : "transparent",
            justifyContent: "center",
            alignItems: "center",
            marginRight: isRTL ? 0 : scale(10),
            marginLeft: isRTL ? scale(10) : 0,
            marginTop: verticalScale(2),
          }}
        >
          {termsAccepted && (
            <Ionicons name="checkmark" size={scale(14)} color="#fff" />
          )}
        </View>
        <Text
          style={{
            fontSize: fontSizes.FONT12,
            fontFamily: "Poppins_400Regular",
            color: colors.textSecondary,
            flex: 1,
            lineHeight: fontSizes.FONT12 * 1.6,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("cert.termsText1")}{" "}
          <Text style={{ color: colors.primary, textDecorationLine: "underline" }}>
            {t("cert.termsLink1")}
          </Text>{" "}
          {t("cert.termsText2")}{" "}
          <Text style={{ color: colors.primary, textDecorationLine: "underline" }}>
            {t("cert.termsLink2")}
          </Text>{" "}
          {t("cert.termsText3")}
        </Text>
      </TouchableOpacity>
      {errors.terms ? (
        <Text
          style={{
            fontSize: fontSizes.FONT11,
            color: colors.error,
            marginBottom: verticalScale(8),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {errors.terms}
        </Text>
      ) : null}

      <ErrorBanner />
      <GradientButton
        onPress={handleSubmit}
        label={t("cert.confirmRegistration")}
        disabled={!termsAccepted}
      />

      {/* Already have an account? */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop: verticalScale(16),
          alignSelf: "center",
          paddingVertical: verticalScale(6),
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.FONT13,
            fontFamily: "Poppins_500Medium",
            color: colors.primary,
            textAlign: "center",
          }}
        >
          {t("cert.alreadyHaveAccount")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── Main Render ───────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <AppHeader title={t("cert.title")} />

      {/* Step Indicator */}
      <View style={{ backgroundColor: colors.card }}>
        <StepIndicator />
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(20),
            paddingBottom: verticalScale(40),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            }}
          >
            {currentStep === 0 && renderStep0()}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Network Logger Panel ─────────────────── */}
      <TouchableOpacity
        onPress={() => setShowNetLogger(!showNetLogger)}
        style={{
          position: "absolute",
          bottom: verticalScale(10),
          right: scale(10),
          backgroundColor: netLogs.length > 0 && netLogs[0].error ? "#ef4444" : "#1e7bb9",
          width: scale(44),
          height: scale(44),
          borderRadius: scale(22),
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      >
        <Ionicons name="code-slash" size={scale(20)} color="#fff" />
        {netLogs.length > 0 && (
          <View style={{
            position: "absolute", top: -2, right: -2,
            backgroundColor: "#f59e0b", borderRadius: 10,
            minWidth: scale(18), height: scale(18),
            justifyContent: "center", alignItems: "center",
          }}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>{netLogs.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showForeignInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForeignInfoModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: scale(18),
          }}
          onPress={() => setShowForeignInfoModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: scale(360),
              backgroundColor: colors.card,
              borderRadius: scale(18),
              paddingHorizontal: scale(18),
              paddingVertical: verticalScale(18),
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.12,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: fontSizes.FONT17,
                fontFamily: "Poppins_700Bold",
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
                marginBottom: verticalScale(10),
              }}
            >
              {t("cert.foreignModalTitle")}
            </Text>
            <Text
              style={{
                fontSize: fontSizes.FONT13,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                textAlign: isRTL ? "right" : "left",
                lineHeight: fontSizes.FONT13 * 1.8,
                marginBottom: verticalScale(12),
              }}
            >
              {t("cert.foreignModalIntro")}
            </Text>

            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_600SemiBold",
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
                lineHeight: fontSizes.FONT14 * 1.8,
              }}
            >
              1- {t("cert.foreignModalStep1Prefix")}
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={openQuadraBayLink}
              style={{
                marginTop: verticalScale(6),
                marginBottom: verticalScale(8),
                alignSelf: isRTL ? "flex-end" : "flex-start",
                backgroundColor: isDark ? "rgba(30,123,185,0.18)" : "#e8f4f8",
                borderWidth: 1,
                borderColor: isDark ? "rgba(30,123,185,0.35)" : "#b8dff0",
                paddingHorizontal: scale(12),
                paddingVertical: verticalScale(8),
                borderRadius: scale(10),
              }}
            >
              <Text
                style={{
                  fontSize: fontSizes.FONT13,
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.primary,
                  textDecorationLine: "underline",
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {t("cert.foreignModalStep1Link")}
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_500Medium",
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
                lineHeight: fontSizes.FONT14 * 1.8,
                marginBottom: verticalScale(4),
              }}
            >
              2- {t("cert.foreignModalStep2")}
            </Text>
            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_500Medium",
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
                lineHeight: fontSizes.FONT14 * 1.8,
              }}
            >
              3- {t("cert.foreignModalStep3")}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showNetLogger}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNetLogger(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <TouchableOpacity style={{ flex: 0.15 }} onPress={() => setShowNetLogger(false)} />
          <View style={{
            flex: 0.85,
            backgroundColor: isDark ? "#0f1117" : "#fff",
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            overflow: "hidden",
          }}>
            {/* Header */}
            <View style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              paddingHorizontal: scale(16), paddingVertical: verticalScale(12),
              backgroundColor: isDark ? "#1a1d27" : "#f1f5f9",
              borderBottomWidth: 1, borderBottomColor: isDark ? "#2a2d3a" : "#e2e8f0",
            }}>
              <Text style={{ fontSize: fontSizes.FONT16, fontFamily: "Poppins_600SemiBold", color: isDark ? "#f1f5f9" : "#1e293b" }}>
                Network Logger ({netLogs.length})
              </Text>
              <View style={{ flexDirection: "row", gap: scale(12) }}>
                <TouchableOpacity onPress={() => setNetLogs([])}>
                  <Ionicons name="trash-outline" size={scale(20)} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowNetLogger(false)}>
                  <Ionicons name="close" size={scale(22)} color={isDark ? "#f1f5f9" : "#1e293b"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Logs */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: scale(12) }}>
              {netLogs.length === 0 && (
                <View style={{ alignItems: "center", paddingTop: verticalScale(40) }}>
                  <Ionicons name="radio-outline" size={scale(40)} color={isDark ? "#3a3d4a" : "#cbd5e1"} />
                  <Text style={{ color: isDark ? "#64748b" : "#94a3b8", marginTop: verticalScale(8), fontFamily: "Poppins_400Regular" }}>
                    No network requests yet
                  </Text>
                </View>
              )}
              {netLogs.map((log) => {
                const isError = !!log.error || (log.status && log.status >= 400);
                const isSuccess = log.status && log.status >= 200 && log.status < 300;
                const statusColor = isError ? "#ef4444" : isSuccess ? "#22c55e" : "#f59e0b";
                const shortUrl = log.url;
                return (
                  <View
                    key={log.id}
                    style={{
                      backgroundColor: isDark ? "#1a1d27" : "#f8f9fa",
                      borderRadius: scale(10),
                      padding: scale(12),
                      marginBottom: verticalScale(8),
                      borderLeftWidth: 3,
                      borderLeftColor: statusColor,
                    }}
                  >
                    {/* Status + Method + Duration + Time */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: verticalScale(6) }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                        <View style={{
                          backgroundColor: statusColor,
                          paddingHorizontal: scale(10), paddingVertical: verticalScale(4), borderRadius: scale(6),
                        }}>
                          <Text style={{ color: "#fff", fontSize: 14, fontFamily: "Poppins_600SemiBold" }}>
                            {log.status || "ERR"}
                          </Text>
                        </View>
                        <View style={{
                          backgroundColor: log.method === "GET" ? "#3b82f6" : log.method === "POST" ? "#22c55e" : "#f59e0b",
                          paddingHorizontal: scale(8), paddingVertical: verticalScale(3), borderRadius: scale(5),
                        }}>
                          <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>{log.method}</Text>
                        </View>
                        <Text style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 11, fontFamily: "Poppins_500Medium" }}>{log.duration}ms</Text>
                      </View>
                      <Text style={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: 10 }}>{log.time}</Text>
                    </View>
                    {/* URL */}
                    <Text style={{ color: isDark ? "#e2e8f0" : "#1e293b", fontSize: 12, fontFamily: "Poppins_500Medium", marginBottom: verticalScale(6) }} selectable>
                      {shortUrl}
                    </Text>
                    {/* Request Body */}
                    {log.reqBody && (
                      <View style={{ marginBottom: verticalScale(4) }}>
                        <Text style={{ color: "#3b82f6", fontSize: 9, fontFamily: "Poppins_600SemiBold", marginBottom: 2 }}>REQUEST:</Text>
                        <View style={{ backgroundColor: isDark ? "#0f1117" : "#e2e8f0", borderRadius: scale(6), padding: scale(8) }}>
                          <Text style={{ color: isDark ? "#cbd5e1" : "#334155", fontSize: 10, fontFamily: "Poppins_400Regular" }} selectable>
                            {JSON.stringify(log.reqBody, null, 2).slice(0, 500)}
                          </Text>
                        </View>
                      </View>
                    )}
                    {/* Response Body */}
                    <View>
                      <Text style={{ color: isError ? "#ef4444" : "#22c55e", fontSize: 9, fontFamily: "Poppins_600SemiBold", marginBottom: 2 }}>RESPONSE:</Text>
                      <View style={{ backgroundColor: isDark ? "#0f1117" : "#e2e8f0", borderRadius: scale(6), padding: scale(8) }}>
                        <Text style={{ color: isDark ? "#cbd5e1" : "#334155", fontSize: 10, fontFamily: "Poppins_400Regular" }} selectable>
                          {log.resBody ? JSON.stringify(log.resBody, null, 2).slice(0, 800) : log.error || "No response"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Date Picker Modal ──────────────────── */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
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
                {t("cert.selectBirthDate")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setBirthDate(`${selectedYear}-${selectedMonth}-${selectedDay}`);
                  setErrors((p) => ({ ...p, birthDate: "" }));
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

            {/* Scrollable columns: Year / Month / Day */}
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
                        backgroundColor: selectedYear === item ? colors.primaryLight : "transparent",
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
                        backgroundColor: selectedMonth === item ? colors.primaryLight : "transparent",
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
                        backgroundColor: selectedDay === item ? colors.primaryLight : "transparent",
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
    </View>
  );
}
