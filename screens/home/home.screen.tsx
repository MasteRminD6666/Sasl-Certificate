import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  TextInput,
  Image,
  Linking,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { Ionicons } from "@expo/vector-icons";
import {
  fontSizes,
  IsAndroid,
  IsHaveNotch,
  IsIPAD,
} from "@/themes/app.constant";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import useUserData from "@/hooks/useUserData";
import { router, useFocusEffect } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";

// ─── Config (mirrors project.config.js) ─────────────────────
const SASL_BASE = "https://sasl.sba.gov.sa";
const MAIN_COURSE_ID = 17;
const NEW_MAIN_COURSE_ID = 189;
const IS_NEW_JOURNEY = true;
const PAID_COURSE_STATUS = 17;
const RENEWAL_COURSE_ID = 187; // for expired cert renewal
const CERTIFICATE_TYPE_ID = 1;
const APPOINTMENT_TYPE_ID = 1;
const NAMES_MAX_LENGTH = 28;
const MAX_CERTIFICATES = 3;
const MAX_FILE_SIZE_MB = 10;

// Level tag IDs → sort order (from project.config.js newLevels)
const NEW_LEVELS: Map<number, number[]> = new Map([
  [56, [189, 192, 193, 194, 190, 191]],
  [57, [195, 197, 200, 202, 203, 205]],
  [58, [206, 220, 208, 209, 210, 211, 212]],
  [59, [213, 214, 215, 216, 218, 219]],
]);
const OLD_LEVELS: Map<number, number[]> = new Map([
  [7, [17, 10, 8, 14, 11, 12]],
  [8, [4, 18, 13, 9, 15, 6]],
  [9, [22, 25, 5, 7, 16, 1]],
  [10, [21, 19, 26, 20, 27, 59]],
]);

// Certificate statuses (mirrors certificate-statuses.util.js)
const CERT_STATUSES: Record<number, { title: string; color: string }> = {
  0: { title: "certSteps.statuses.pending", color: "warning" },
  1: { title: "certSteps.statuses.approved", color: "success" },
  2: { title: "certSteps.statuses.declined", color: "error" },
};

// ─── API helper ──────────────────────────────────────────────
const saslApi = async (path: string) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) {
    throw new Error("No access token found in SecureStore");
  }
  const res = await axios.get(`${SASL_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return res;
};

const saslPost = async (path: string, data?: any) => {
  const token = await SecureStore.getItemAsync("accessToken");
  return axios.post(`${SASL_BASE}${path}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": data instanceof FormData ? "multipart/form-data" : "application/json",
    },
  });
};

const saslPatch = async (path: string, data?: any) => {
  const token = await SecureStore.getItemAsync("accessToken");
  return axios.patch(`${SASL_BASE}${path}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

const saslDelete = async (path: string) => {
  const token = await SecureStore.getItemAsync("accessToken");
  return axios.delete(`${SASL_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
};

// ─── Types ───────────────────────────────────────────────────
interface StepStatus {
  id: number;
  title: string;
  color: string;
}

interface StepData {
  name: string;
  heading: string;
  isAvailable: boolean;
  isComplete: boolean;
  status: StepStatus | null;
}

interface LevelCourse {
  id: number;
  title: string;
  event_pic_url?: string;
  isFinished: boolean;
  isAvailable: boolean;
  modulesAmount: number;
  _links?: { canonical?: { href?: string } };
}

interface LevelData {
  courses: LevelCourse[];
  isAvailable: boolean;
}

interface CertFile {
  id?: number;
  name: string;
  url?: string;
  status?: { id: number; description?: string };
  isLoading: boolean;
  isLocal?: boolean; // true for newly picked files
  localUri?: string;
  mimeType?: string;
}

interface AppointmentData {
  id: number;
  status: number;
  is_expired?: boolean;
  appointment: {
    id: number;
    date: string;
    link?: string;
  };
}

interface AvailableDate {
  id: number;
  date: string;
  total_seats: number;
  reserved_seats: number;
}

// ═════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { name } = useUserData();
  const isDark = theme.dark;
  const bottomTabBarHeight = useBottomTabBarHeight();

  // ── Core state ─────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── API data ───────────────────────────────────────────
  const [userId, setUserId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [mainCourseBooking, setMainCourseBooking] = useState<any>(null);
  const [renewalCourseBooking, setRenewalCourseBooking] = useState<any>(null);

  // Certificates
  const [certFiles, setCertFiles] = useState<CertFile[]>([]);
  const [certFilesToDelete, setCertFilesToDelete] = useState<CertFile[]>([]);
  const [certIsUploading, setCertIsUploading] = useState(false);
  const [certErrorMessage, setCertErrorMessage] = useState("");
  

  // Levels
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(0);

  // Test
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<number | null>(null);
  const [testPassed, setTestPassed] = useState(false);
  const [certExpired, setCertExpired] = useState(false);
  const [reservedAppointments, setReservedAppointments] = useState<AppointmentData[]>([]);
  const [isDatesLoading, setIsDatesLoading] = useState(false);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);

  // Accreditation
  const [arName, setArName] = useState("");
  const [enName, setEnName] = useState("");
  const [savedArName, setSavedArName] = useState<string | null>(null);
  const [savedEnName, setSavedEnName] = useState<string | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [accredLoading, setAccredLoading] = useState(false);

  // ── Steps (mirrors UserStepsBody.vue data) ─────────────
  const [steps, setSteps] = useState<StepData[]>([
    { name: "paymentVerification", heading: "certSteps.payment.heading", isAvailable: true, isComplete: false, status: null },
    { name: "certificates", heading: "certSteps.certificates.heading", isAvailable: false, isComplete: false, status: null },
    { name: "levels", heading: "certSteps.levels.heading", isAvailable: false, isComplete: false, status: null },
    { name: "certificationTest", heading: "certSteps.test.heading", isAvailable: false, isComplete: false, status: null },
    { name: "accreditationProgramCertificate", heading: "certSteps.accreditation.heading", isAvailable: false, isComplete: false, status: null },
  ]);

  // ── Colors ─────────────────────────────────────────────
  const colors = {
    bg: isDark ? "#0f1117" : "#f5f7fa",
    card: isDark ? "#1a1d27" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    primary: "#1e7bb9",
    primaryLight: isDark ? "rgba(30,123,185,0.12)" : "#e8f4f8",
    success: "#22c55e",
    successBg: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)",
    error: "#ef4444",
    errorBg: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
    warning: "#f59e0b",
    warningBg: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
    border: isDark ? "#2a2d3a" : "#e2e8f0",
    inputBg: isDark ? "#1e2130" : "#f8f9fa",
    stepInactive: isDark ? "#3a3d4a" : "#cbd5e1",
    stepDisabled: isDark ? "#2a2d3a" : "#e2e8f0",
  };

  const statusColor = (color: string) => {
    if (color === "success") return colors.success;
    if (color === "error") return colors.error;
    if (color === "warning") return colors.warning;
    return colors.textSecondary;
  };

  const statusBgColor = (color: string) => {
    if (color === "success") return colors.successBg;
    if (color === "error") return colors.errorBg;
    if (color === "warning") return colors.warningBg;
    return colors.primaryLight;
  };

  // ══════════════════════════════════════════════════════════
  //  STEP STATUS UPDATES (mirrors UserStepsBody.vue methods)
  // ══════════════════════════════════════════════════════════

  const updateStepStatus = useCallback(
    (index: number, status: StepStatus | null, unlockNext?: boolean) => {
      setSteps((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status };

        // Payment: isComplete when status.id === 1
        if (index === 0) {
          updated[0].isComplete = status?.id === 1;
          updated[1].isAvailable = status?.id === 1;
        }
        // Certificates: isComplete when status.id === 1
        if (index === 1 && status) {
          updated[1].isComplete = status.id === 1;
          updated[2].isAvailable = status.id === 1;
        }
        // Levels: isComplete when status.id === 1
        if (index === 2 && status) {
          updated[2].isComplete = status.id === 1;
          updated[3].isAvailable = status.id === 1;
        }
        // Test: isComplete when status.id === 3 (passed)
        if (index === 3 && status) {
          updated[3].isComplete = status.id === 3;
          updated[4].isAvailable = status.id === 3;
        }
        // Accreditation: just update status
        if (index === 4) {
          updated[4].status = status;
        }

        return updated;
      });
    },
    []
  );

  // ══════════════════════════════════════════════════════════
  //  FETCH DATA (mirrors UserSteps.vue fetchData)
  // ══════════════════════════════════════════════════════════

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Get user info (/api/v3/me)
      let meRes;
      try {
        meRes = await saslApi("/api/v3/me");
      } catch (meErr: any) {
        const status = meErr?.response?.status;
        setLoading(false);
        return;
      }
      const uid = meRes.data?.data?.id || meRes.data?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      setUserId(uid);

      // 2. Get bookings (/api/v3/users/{uid}/bookings)
      const bookingsRes = await saslApi(`/api/v3/users/${uid}/bookings?remove_approval_flag=true`);
      const userBookings: any[] = bookingsRes.data?.data || [];
      setBookings(userBookings);

      // Find main course booking (new journey first, then old)
      // Use == (loose equality) because service_id may come as string or number from API
      let booking: any = null;
      if (IS_NEW_JOURNEY) {
        booking =
          userBookings.find((b: any) => b.service_id == NEW_MAIN_COURSE_ID) ||
          userBookings.find((b: any) => b.service_id == MAIN_COURSE_ID);
      } else {
        booking = userBookings.find((b: any) => b.service_id == MAIN_COURSE_ID);
      }
      setMainCourseBooking(booking);

      // Find renewal course booking
      const renewal = userBookings.find(
        (b: any) => b.service_id === RENEWAL_COURSE_ID && b.status?.id === PAID_COURSE_STATUS
      );
      setRenewalCourseBooking(renewal);

      // ── Payment status ──
      const hasPaid = !!booking;
      if (hasPaid) {
        updateStepStatus(0, { id: 1, title: "certSteps.statuses.passed", color: "success" });
      } else {
        updateStepStatus(0, null);
      }

      // Don't return early - always fetch all steps data for testing
      if (!booking) {
        setCurrentStep(0);
      }

      // 3. Certificates
      let certStatusId: number | undefined;
      try {
        const certsRes = await saslApi(
          `/api/v2/users/${uid}/type/${CERTIFICATE_TYPE_ID}/certificate/${uid}`
        );
        const certs: any[] = certsRes.data?.data || [];
        const mapped: CertFile[] = certs.map((c: any) => ({
          id: c.id,
          name: c.file_name,
          url: c._links?.file_url?.href,
          status: { id: c.status, description: c.description },
          isLoading: false,
          isLocal: false,
        }));
        setCertFiles(mapped);
        setCertFilesToDelete([]);

        // Determine status by priority [1, 2, 0] (mirrors UserCertificates.vue)
        const priority = [1, 2, 0];
        for (const id of priority) {
          if (mapped.some((f) => f.status?.id === id)) {
            certStatusId = id;
            break;
          }
        }

        if (typeof certStatusId === "number") {
          updateStepStatus(1, { id: certStatusId, ...CERT_STATUSES[certStatusId] });
        } else {
          updateStepStatus(1, null);
        }
      } catch {
        updateStepStatus(1, null);
      }

      // 4. Levels (always fetch, same as web app)
      let allLevelsComplete = false;
      {
        try {
          const isNewCourseLevels =
            IS_NEW_JOURNEY && booking?.service_id === NEW_MAIN_COURSE_ID;
          const levelMap = isNewCourseLevels ? NEW_LEVELS : OLD_LEVELS;
          const levelTagIds = [...levelMap.keys()];


          const levelResponses = await Promise.all(
            levelTagIds.map((tagId) =>
              saslApi(`/api/v3/services?tag_id=${tagId}`).catch((err) => {
                return { data: { data: [] }, _error: `tag ${tagId}: ${err?.response?.status || err?.message}` };
              })
            )
          );

          const allLevels: LevelData[] = levelResponses.map(
            (res, levelIndex) => {
              const sortOrder = levelMap.get(levelTagIds[levelIndex]);
              let levelCoursesRaw: any[] = res.data?.data || [];

              // Sort/filter by config order
              if (sortOrder && levelCoursesRaw.length > 0) {
                const filtered = levelCoursesRaw.filter((c: any) =>
                  sortOrder.includes(c.id)
                );
                if (filtered.length > 0) {
                  levelCoursesRaw = filtered.sort(
                    (a: any, b: any) =>
                      sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id)
                  );
                }
                // If filter removes everything, keep all courses unfiltered
              }

              // Map booking data
              let levelCourses = levelCoursesRaw.map((course: any) => {
                const bk = userBookings.find(
                  (b: any) => b.service_id === course.id
                );
                return {
                  ...course,
                  isFinished: bk?.progress === 100,
                  modulesAmount: bk?.modules?.amount || 0,
                };
              });

              // Availability: first course always available, then previous must be finished
              levelCourses = levelCourses.map(
                (course: any, courseIndex: number) => ({
                  ...course,
                  isAvailable:
                    courseIndex === 0 ||
                    levelCourses[courseIndex - 1]?.isFinished,
                })
              );

              return {
                courses: levelCourses,
                isAvailable:
                  levelIndex === 0 ||
                  levelCourses[levelIndex]?.isAvailable,
              };
            }
          );

          setLevels(allLevels);

          // Check all levels finished (last course of last level)
          if (allLevels.length > 0) {
            const lastLevel = allLevels[allLevels.length - 1];
            const lastCourse =
              lastLevel.courses[lastLevel.courses.length - 1];
            allLevelsComplete = lastCourse?.isFinished || false;
          }

          if (allLevelsComplete) {
            updateStepStatus(2, {
              id: 1,
              title: "certSteps.statuses.passed",
              color: "success",
            });
          } else {
            updateStepStatus(2, null);
          }

          // Auto-navigate to last available level
          const lastAvailIdx = allLevels
            .map((l) => l.isAvailable)
            .lastIndexOf(true);
          if (lastAvailIdx >= 0) setSelectedLevel(lastAvailIdx);
        } catch (levelsErr: any) {
          updateStepStatus(2, null);
        }
      }

      // 5. Certification Test (always fetch, same as web app)
      let isPassed = false;
      {
        try {
          // Get user appointments
          const apptRes = await saslApi(
            `/api/v2/users/${uid}/type/${APPOINTMENT_TYPE_ID}/appointments/1`
          );
          const appts: AppointmentData[] = apptRes.data?.data || [];
          setAppointments(appts);

          isPassed = appts.some((a) => a.status === 3);
          const isExpired = appts[0]?.is_expired || false;
          setTestPassed(isPassed);
          setCertExpired(isExpired);

          setReservedAppointments(
            appts.filter((a) => +new Date(a.appointment.date) > Date.now())
          );

          if (isPassed && !isExpired) {
            updateStepStatus(3, {
              id: 3,
              title: "certSteps.statuses.passed",
              color: "success",
            });
          }

          // Get available dates
          const datesRes = await saslApi(
            `/api/v2/users/${uid}/type/${APPOINTMENT_TYPE_ID}/appointments`
          );
          const dates: AvailableDate[] = datesRes.data?.data || [];
          // Filter duplicates
          const uniqueDates = dates.filter(
            (d, i, self) => i === self.findIndex((t) => t.date === d.date)
          );
          setAvailableDates(
            uniqueDates.filter((d) => d.total_seats > d.reserved_seats)
          );
        } catch {
          /* appointments may fail */
        }
      }

      // 6. Accreditation (always fetch)
      {
        try {
          const userRes = await saslApi(`/api/v2/users/${uid}`);
          const userData = userRes.data?.data || userRes.data;
          const arN = userData?.ar_name || "";
          const enN = userData?.en_name || "";
          setSavedArName(arN || null);
          setSavedEnName(enN || null);
          setArName(arN);
          setEnName(enN);

          // Generate certificate if names exist
          if (arN && enN && booking?.id) {
            const certRes = await saslApi(
              `/api/v2/users/${uid}/bookings/${booking.id}/files/accreditation_cert`
            );
            setCertificateUrl(certRes.data?.data?.file_url || null);
          }
        } catch {
          /* user info may fail */
        }
      }

      // Auto-navigate to first incomplete step
      if (!hasPaid) setCurrentStep(0);
      else if (certStatusId !== 1) setCurrentStep(1);
      else if (!allLevelsComplete) setCurrentStep(2);
      else if (!isPassed) setCurrentStep(3);
      else setCurrentStep(4);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateStepStatus]);

  useEffect(() => {
    fetchData();
  }, []);

  // Re-check payment status when returning from webview
  const isFirstMount = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      // Only re-check booking status, not full data
      const recheckPayment = async () => {
        try {
          // If userId isn't set yet, fetch it first
          let uid = userId;
          if (!uid) {
            const meRes = await saslApi("/api/v3/me");
            uid = meRes.data?.data?.id || meRes.data?.id;
            if (uid) setUserId(uid);
          }
          if (!uid) {
            return;
          }

          const bookingsRes = await saslApi(`/api/v3/users/${uid}/bookings?remove_approval_flag=true`);
          const userBookings: any[] = bookingsRes.data?.data || [];
          setBookings(userBookings);

          let booking: any = null;
          if (IS_NEW_JOURNEY) {
            booking =
              userBookings.find((b: any) => b.service_id == NEW_MAIN_COURSE_ID) ||
              userBookings.find((b: any) => b.service_id == MAIN_COURSE_ID);
          } else {
            booking = userBookings.find((b: any) => b.service_id == MAIN_COURSE_ID);
          }
          setMainCourseBooking(booking);

          if (booking) {
            updateStepStatus(0, { id: 1, title: "certSteps.statuses.passed", color: "success" });
            // Also auto-navigate to next step
            setCurrentStep(1);
          }
        } catch {
        }
      };
      recheckPayment();
    }, [userId, updateStepStatus])
  );

  // ── Navigation ─────────────────────────────────────────
  const goToStep = (index: number) => {
    if (steps[index]?.isAvailable) setCurrentStep(index);
  };

  const openWebView = (url: string, title?: string) => {
    router.push({
      pathname: "/(routes)/webview",
      params: { url, title: title || "" },
    });
  };

  // ══════════════════════════════════════════════════════════
  //  RENDER: Header
  // ══════════════════════════════════════════════════════════

  const renderHeader = () => (
    <LinearGradient
      colors={
        isDark
          ? ["#3c43485c", "#3c43485c", "#3c43485c"]
          : ["#75ABFC", "#0047AB"]
      }
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 1 }}
      style={{
        paddingTop: IsAndroid
          ? verticalScale(40)
          : IsHaveNotch
          ? IsIPAD
            ? verticalScale(30)
            : verticalScale(40)
          : verticalScale(30),
        paddingBottom: verticalScale(20),
        paddingHorizontal: moderateScale(25),
        borderBottomLeftRadius: moderateScale(40),
        borderBottomRightRadius: moderateScale(40),
      }}
    >
      <StatusBar barStyle="light-content" />
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSizes.FONT28,
              color: "#fff",
              fontFamily: "Poppins_600SemiBold",
            }}
          >
            {t("certSteps.header.title")}
          </Text>
          <Text
            style={{
              fontSize: fontSizes.FONT13,
              color: "rgba(255,255,255,0.8)",
              fontFamily: "Poppins_400Regular",
              marginTop: verticalScale(2),
            }}
            numberOfLines={3}
          >
            {t("certSteps.header.subtitle")}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(routes)/notification")}
          style={{
            width: scale(45),
            height: scale(45),
            borderRadius: scale(10),
            backgroundColor: isDark ? "transparent" : "#004FAB",
            borderWidth: isDark ? 1 : 0,
            borderColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="notifications-sharp" size={scale(25)} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  // ══════════════════════════════════════════════════════════
  //  RENDER: Step Navigation (mirrors v-stepper-header)
  // ══════════════════════════════════════════════════════════

  const renderStepNav = () => {
    return (
    <View
      style={{
        paddingHorizontal: scale(16),
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(10),
      }}
    >
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: verticalScale(4) }}>
        <Text
          style={{
            fontSize: fontSizes.FONT15,
            fontFamily: "Poppins_600SemiBold",
            color: colors.text,
            flex: 1,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("certSteps.nav.heading")}
        </Text>
        <TouchableOpacity
          onPress={() => { setTourStep(0); setShowTour(true); }}
          style={{
            width: scale(30), height: scale(30), borderRadius: scale(15),
            backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center",
          }}
        >
          <Ionicons name="help-circle-outline" size={scale(18)} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <Text
        style={{
          fontSize: fontSizes.FONT12,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          marginBottom: verticalScale(14),
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {t("certSteps.nav.subheading")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: isRTL ? "row-reverse" : "row",
          gap: scale(8),
          paddingBottom: verticalScale(4),
        }}
      >
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isComplete = step.isComplete;
          const isDisabled = !step.isAvailable;
          return (
            <TouchableOpacity
              key={step.name}
              onPress={() => goToStep(index)}
              disabled={isDisabled}
              activeOpacity={0.7}
              style={{
                minWidth: scale(120),
                paddingVertical: verticalScale(14),
                paddingHorizontal: scale(16),
                borderRadius: scale(14),
                backgroundColor: isActive
                  ? colors.primary
                  : isComplete
                  ? colors.successBg
                  : isDisabled
                  ? colors.stepDisabled
                  : colors.card,
                borderWidth: isActive ? 0 : 1,
                borderColor: isComplete ? colors.success : colors.border,
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              {/* Status label */}
              {step.status && (
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    marginBottom: verticalScale(6),
                  }}
                >
                  <View
                    style={{
                      width: scale(6),
                      height: scale(6),
                      borderRadius: scale(3),
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.8)"
                        : statusColor(step.status.color),
                      marginRight: isRTL ? 0 : scale(6),
                      marginLeft: isRTL ? scale(6) : 0,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: fontSizes.FONT10,
                      fontFamily: "Poppins_500Medium",
                      color: isActive
                        ? "rgba(255,255,255,0.8)"
                        : statusColor(step.status.color),
                    }}
                  >
                    {t(step.status.title)}
                  </Text>
                </View>
              )}
              {/* Step number */}
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  marginBottom: verticalScale(6),
                }}
              >
                <View
                  style={{
                    width: scale(28),
                    height: scale(28),
                    borderRadius: scale(14),
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.2)"
                      : isComplete
                      ? colors.success
                      : colors.primaryLight,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: isRTL ? 0 : scale(8),
                    marginLeft: isRTL ? scale(8) : 0,
                  }}
                >
                  {isComplete ? (
                    <Ionicons
                      name="checkmark"
                      size={scale(14)}
                      color="#fff"
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: fontSizes.FONT12,
                        fontFamily: "Poppins_600SemiBold",
                        color: isActive ? "#fff" : colors.primary,
                      }}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
              </View>
              {/* Title */}
              <Text
                style={{
                  fontSize: fontSizes.FONT12,
                  fontFamily: isActive
                    ? "Poppins_600SemiBold"
                    : "Poppins_500Medium",
                  color: isActive
                    ? "#fff"
                    : isDisabled
                    ? colors.textSecondary
                    : colors.text,
                  textAlign: isRTL ? "right" : "left",
                }}
                numberOfLines={2}
              >
                {t(step.heading)}
              </Text>
              {/* Unavailable tooltip */}
              {isDisabled && (
                <Text
                  style={{
                    fontSize: fontSizes.FONT10,
                    fontFamily: "Poppins_400Regular",
                    color: colors.textSecondary,
                    marginTop: verticalScale(4),
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {t("certSteps.nav.unavailable")}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
  };

  // ── Shared Alert Components ────────────────────────────
  const SuccessAlert = ({
    heading,
    subtitle,
    buttonLabel,
    onPress,
  }: {
    heading: string;
    subtitle: string;
    buttonLabel?: string;
    onPress?: () => void;
  }) => (
    <View
      style={{
        backgroundColor: colors.successBg,
        borderRadius: scale(14),
        padding: scale(16),
        marginBottom: verticalScale(16),
        borderLeftWidth: isRTL ? 0 : 4,
        borderRightWidth: isRTL ? 4 : 0,
        borderLeftColor: isRTL ? undefined : colors.success,
        borderRightColor: isRTL ? colors.success : undefined,
      }}
    >
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          marginBottom: verticalScale(6),
        }}
      >
        <Ionicons
          name="checkmark-circle"
          size={scale(22)}
          color={colors.success}
        />
        <Text
          style={{
            flex: 1,
            fontSize: fontSizes.FONT15,
            fontFamily: "Poppins_600SemiBold",
            color: colors.success,
            marginLeft: isRTL ? 0 : scale(8),
            marginRight: isRTL ? scale(8) : 0,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {heading}
        </Text>
      </View>
      <Text
        style={{
          fontSize: fontSizes.FONT13,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          marginBottom: onPress ? verticalScale(12) : 0,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {subtitle}
      </Text>
      {onPress && buttonLabel && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <LinearGradient
            colors={["#22c55e", "#16a34a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: verticalScale(10),
              paddingHorizontal: scale(20),
              borderRadius: scale(10),
              alignSelf: isRTL ? "flex-end" : "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_600SemiBold",
                color: "#fff",
              }}
            >
              {buttonLabel}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const ErrorAlert = ({
    heading,
    subtitle,
    buttonLabel,
    onPress,
  }: {
    heading: string;
    subtitle: string;
    buttonLabel?: string;
    onPress?: () => void;
  }) => (
    <View
      style={{
        backgroundColor: colors.errorBg,
        borderRadius: scale(14),
        padding: scale(16),
        marginBottom: verticalScale(16),
        borderLeftWidth: isRTL ? 0 : 4,
        borderRightWidth: isRTL ? 4 : 0,
        borderLeftColor: isRTL ? undefined : colors.error,
        borderRightColor: isRTL ? colors.error : undefined,
      }}
    >
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          marginBottom: verticalScale(6),
        }}
      >
        <Ionicons
          name="close-circle"
          size={scale(22)}
          color={colors.error}
        />
        <Text
          style={{
            flex: 1,
            fontSize: fontSizes.FONT15,
            fontFamily: "Poppins_600SemiBold",
            color: colors.error,
            marginLeft: isRTL ? 0 : scale(8),
            marginRight: isRTL ? scale(8) : 0,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {heading}
        </Text>
      </View>
      <Text
        style={{
          fontSize: fontSizes.FONT13,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          marginBottom: onPress ? verticalScale(12) : 0,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {subtitle}
      </Text>
      {onPress && buttonLabel && (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.error,
            paddingVertical: verticalScale(10),
            paddingHorizontal: scale(20),
            borderRadius: scale(10),
            alignSelf: isRTL ? "flex-end" : "flex-start",
          }}
        >
          <Text
            style={{
              fontSize: fontSizes.FONT14,
              fontFamily: "Poppins_600SemiBold",
              color: "#fff",
            }}
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ══════════════════════════════════════════════════════════
  //  STEP 1: Payment Verification
  //  (mirrors UserPaymentVerification.vue)
  // ══════════════════════════════════════════════════════════

  const renderPayment = () => {
    const hasPaid = steps[0].isComplete;
    const checkoutUrl = IS_NEW_JOURNEY
      ? `${SASL_BASE}/ar/e/${NEW_MAIN_COURSE_ID}/checkout/`
      : `${SASL_BASE}/ar/e/${MAIN_COURSE_ID}/checkout/`;

    return (
      <View>
        <Text
          style={{
            fontSize: fontSizes.FONT20,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
            marginBottom: verticalScale(16),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("certSteps.payment.heading")}
        </Text>


        {hasPaid ? (
          <SuccessAlert
            heading={t("certSteps.payment.successHeading")}
            subtitle={t("certSteps.payment.successSubtitle")}
            buttonLabel={t("certSteps.actions.continue")}
            onPress={() => goToStep(1)}
          />
        ) : (
          <ErrorAlert
            heading={t("certSteps.payment.errorHeading")}
            subtitle={t("certSteps.payment.errorSubtitle")}
            buttonLabel={t("certSteps.actions.book")}
            onPress={() =>
              openWebView(checkoutUrl, t("certSteps.payment.heading"))
            }
          />
        )}
      </View>
    );
  };

  // ══════════════════════════════════════════════════════════
  //  STEP 2: Certificates
  //  (mirrors UserCertificates.vue)
  // ══════════════════════════════════════════════════════════

  // Certificate status priority
  const getCertStatusId = (): number | undefined => {
    const priority = [1, 2, 0];
    for (const id of priority) {
      if (certFiles.some((f) => f.status?.id === id)) return id;
    }
    return undefined;
  };

  const certHasUnsavedChanges =
    certFilesToDelete.length > 0 ||
    certFiles.some((f) => f.isLocal);

  const handleCertUpload = async () => {
    if (certFiles.length >= MAX_CERTIFICATES) {
      Alert.alert(t("certSteps.certificates.heading"), `${MAX_CERTIFICATES} max`);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];

      // Validate file size (same as web: maxFileSizeMb = 10)
      if (file.size && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setCertErrorMessage(t("certSteps.certificates.maxSize"));
        return;
      }

      setCertErrorMessage("");

      // Add to local list as unsaved
      setCertFiles((prev) => [
        ...prev,
        {
          name: file.name || "certificate",
          isLoading: false,
          isLocal: true,
          localUri: file.uri,
          mimeType: file.mimeType || "application/octet-stream",
          status: undefined,
        },
      ]);
    } catch {
    }
  };

  const handleCertDelete = (index: number) => {
    const file = certFiles[index];
    if (!file.isLocal && file.id) {
      setCertFilesToDelete((prev) => [...prev, file]);
    }
    setCertFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCertSaveAll = async () => {
    if (!userId) return;
    setCertIsUploading(true);
    setCertErrorMessage("");

    try {
      // 1. Delete marked files (same API as web: DELETE /api/v2/users/{userId}/type/{typeId}/certificate/{certId})
      for (const file of certFilesToDelete) {
        if (file.id) {
          await saslDelete(
            `/api/v2/users/${userId}/type/${CERTIFICATE_TYPE_ID}/certificate/${file.id}`
          );
        }
      }

      // 2. Upload new local files (same API as web: POST /api/v3/users/{userId}/type/{typeId}/certificate)
      // Web app sends: formData.append('type', file.type); formData.append('file', file, file.name); formData.append('title', file.name);
      const newFiles = certFiles.filter((f) => f.isLocal && f.localUri);
      for (const file of newFiles) {
        const mimeType = file.mimeType || "application/octet-stream";
        const formData = new FormData();
        formData.append("type", mimeType);
        formData.append("file", {
          uri: file.localUri,
          name: file.name,
          type: mimeType,
        } as any);
        formData.append("title", file.name);

        await saslPost(
          `/api/v3/users/${userId}/type/${CERTIFICATE_TYPE_ID}/certificate`,
          formData
        );
      }

      // 3. Refresh certificates from API (same as web: GET /api/v2/users/{userId}/type/{typeId}/certificate/{userId})
      const certsRes = await saslApi(
        `/api/v2/users/${userId}/type/${CERTIFICATE_TYPE_ID}/certificate/${userId}`
      );
      const certs: any[] = certsRes.data?.data || [];
      const mapped: CertFile[] = certs.map((c: any) => ({
        id: c.id,
        name: c.file_name,
        url: c._links?.file_url?.href,
        status: { id: c.status, description: c.description },
        isLoading: false,
        isLocal: false,
      }));
      setCertFiles(mapped);
      setCertFilesToDelete([]);

      // 3. Update step status (same priority logic as web: [1, 2, 0])
      const priority = [1, 2, 0];
      let newStatusId: number | undefined;
      for (const id of priority) {
        if (mapped.some((f) => f.status?.id === id)) {
          newStatusId = id;
          break;
        }
      }
      if (typeof newStatusId === "number") {
        updateStepStatus(1, { id: newStatusId, ...CERT_STATUSES[newStatusId] });
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      const msg = serverMsg || err?.message || t("certSteps.certificates.declined");
      setCertErrorMessage(msg);
    } finally {
      setCertIsUploading(false);
    }
  };

  const handleCertReset = () => {
    setCertFilesToDelete([]);
    setCertFiles((prev) => prev.filter((f) => !f.isLocal));
    setCertErrorMessage("");
  };

  const renderCertificates = () => {
    const statusId = getCertStatusId();

    return (
      <View>
        <Text
          style={{
            fontSize: fontSizes.FONT20,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
            marginBottom: verticalScale(4),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("certSteps.certificates.heading")}
        </Text>
        <Text
          style={{
            fontSize: fontSizes.FONT13,
            fontFamily: "Poppins_400Regular",
            color: colors.textSecondary,
            marginBottom: verticalScale(16),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("certSteps.certificates.subtitle")}
        </Text>

        {/* Success alert when approved */}
        {statusId === 1 && (
          <SuccessAlert
            heading={t("certSteps.certificates.successHeading")}
            subtitle={t("certSteps.certificates.successSubtitle")}
            buttonLabel={t("certSteps.actions.continueToCourses")}
            onPress={() => goToStep(2)}
          />
        )}

        {/* File list */}
        {certFiles.map((file, i) => (
          <View
            key={i}
            style={{
              padding: scale(14),
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: scale(12),
              marginBottom: verticalScale(8),
              backgroundColor: colors.card,
            }}
          >
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="document-text"
                size={scale(24)}
                color={colors.primary}
              />
              <View
                style={{
                  flex: 1,
                  marginLeft: isRTL ? 0 : scale(12),
                  marginRight: isRTL ? scale(12) : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: fontSizes.FONT14,
                    fontFamily: "Poppins_500Medium",
                    color: colors.text,
                  }}
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
                {file.status && (
                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      marginTop: verticalScale(2),
                    }}
                  >
                    <Ionicons
                      name={
                        file.status.id === 1
                          ? "checkmark-circle"
                          : file.status.id === 2
                          ? "close-circle"
                          : "time"
                      }
                      size={scale(14)}
                      color={statusColor(
                        CERT_STATUSES[file.status.id]?.color || "warning"
                      )}
                    />
                    <Text
                      style={{
                        fontSize: fontSizes.FONT11,
                        color: statusColor(
                          CERT_STATUSES[file.status.id]?.color || "warning"
                        ),
                        fontFamily: "Poppins_400Regular",
                        marginLeft: isRTL ? 0 : scale(4),
                        marginRight: isRTL ? scale(4) : 0,
                      }}
                    >
                      {t(
                        CERT_STATUSES[file.status.id]?.title ||
                          "certSteps.statuses.pending"
                      )}
                    </Text>
                  </View>
                )}
                {file.isLocal && (
                  <Text
                    style={{
                      fontSize: fontSizes.FONT11,
                      color: colors.warning,
                      fontFamily: "Poppins_400Regular",
                    }}
                  >
                    {t("certSteps.certificates.unsaved")}
                  </Text>
                )}
              </View>
              {/* Delete/replace button (only if not approved) */}
              {file.status?.id !== 1 && (
                <TouchableOpacity
                  onPress={() => handleCertDelete(i)}
                  style={{ padding: scale(6) }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={scale(18)}
                    color={colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
            {/* Declined message */}
            {file.status?.id === 2 && (
              <View
                style={{
                  backgroundColor: colors.errorBg,
                  padding: scale(10),
                  borderRadius: scale(8),
                  marginTop: verticalScale(8),
                }}
              >
                <Text
                  style={{
                    fontSize: fontSizes.FONT12,
                    color: colors.error,
                    fontFamily: "Poppins_400Regular",
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {file.status.description ||
                    t("certSteps.certificates.declined")}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Upload area (only if less than max) */}
        {certFiles.length < MAX_CERTIFICATES && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCertUpload}
            style={{
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: colors.primary,
              borderRadius: scale(14),
              paddingVertical: verticalScale(30),
              paddingHorizontal: scale(20),
              alignItems: "center",
              backgroundColor: colors.primaryLight,
              marginBottom: verticalScale(16),
            }}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={scale(36)}
              color={colors.primary}
            />
            <Text
              style={{
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_500Medium",
                color: colors.primary,
                marginTop: verticalScale(8),
              }}
            >
              {t("certSteps.certificates.uploadLabel")}
            </Text>
            <Text
              style={{
                fontSize: fontSizes.FONT11,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                marginTop: verticalScale(4),
              }}
            >
              {t("certSteps.certificates.maxSize")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Error message */}
        {!!certErrorMessage && (
          <View
            style={{
              backgroundColor: colors.errorBg,
              padding: scale(12),
              borderRadius: scale(10),
              marginBottom: verticalScale(12),
            }}
          >
            <Text
              style={{
                fontSize: fontSizes.FONT12,
                color: colors.error,
                fontFamily: "Poppins_400Regular",
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {certErrorMessage}
            </Text>
          </View>
        )}

        {/* Save / Unsaved changes row */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: scale(10),
          }}
        >
          <TouchableOpacity
            onPress={handleCertSaveAll}
            disabled={!certHasUnsavedChanges || certIsUploading}
            activeOpacity={0.8}
            style={{
              backgroundColor:
                !certHasUnsavedChanges || certIsUploading
                  ? colors.stepDisabled
                  : colors.primary,
              paddingVertical: verticalScale(10),
              paddingHorizontal: scale(24),
              borderRadius: scale(10),
            }}
          >
            {certIsUploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={{
                  fontSize: fontSizes.FONT14,
                  fontFamily: "Poppins_600SemiBold",
                  color:
                    !certHasUnsavedChanges || certIsUploading
                      ? colors.textSecondary
                      : "#fff",
                }}
              >
                {t("certSteps.actions.save")}
              </Text>
            )}
          </TouchableOpacity>

          {certHasUnsavedChanges && (
            <View
              style={{
                flex: 1,
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                backgroundColor: colors.primaryLight,
                padding: scale(10),
                borderRadius: scale(10),
              }}
            >
              <Ionicons
                name="information-circle"
                size={scale(16)}
                color={colors.primary}
              />
              <Text
                style={{
                  fontSize: fontSizes.FONT12,
                  fontFamily: "Poppins_400Regular",
                  color: colors.primary,
                  marginLeft: isRTL ? 0 : scale(6),
                  marginRight: isRTL ? scale(6) : 0,
                  flex: 1,
                }}
              >
                {t("certSteps.certificates.unsaved")}
              </Text>
              <TouchableOpacity onPress={handleCertReset}>
                <Text
                  style={{
                    fontSize: fontSizes.FONT12,
                    fontFamily: "Poppins_500Medium",
                    color: colors.primary,
                    textDecorationLine: "underline",
                  }}
                >
                  {t("certSteps.actions.reset")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ══════════════════════════════════════════════════════════
  //  STEP 3: Training Levels
  //  (mirrors UserLevels.vue)
  // ══════════════════════════════════════════════════════════

  const renderLevels = () => {
    const currentLevelData = levels[selectedLevel];
    const areLevelsFinished =
      levels.length > 0 &&
      levels[levels.length - 1].courses[
        levels[levels.length - 1].courses.length - 1
      ]?.isFinished;

    return (
      <View>
        <Text
          style={{
            fontSize: fontSizes.FONT20,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
            marginBottom: verticalScale(4),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("certSteps.levels.heading")}
        </Text>
        <Text
          style={{
            fontSize: fontSizes.FONT13,
            fontFamily: "Poppins_400Regular",
            color: colors.textSecondary,
            marginBottom: verticalScale(16),
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("certSteps.levels.subtitle")}
        </Text>

        {/* Congratulation alert */}
        {areLevelsFinished && (
          <SuccessAlert
            heading={t("certSteps.levels.successHeading")}
            subtitle={t("certSteps.levels.successSubtitle")}
            buttonLabel={t("certSteps.actions.startTest")}
            onPress={() => goToStep(3)}
          />
        )}

        {/* Level tabs */}
        {levels.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: verticalScale(12) }}
            contentContainerStyle={{ flexDirection: isRTL ? "row-reverse" : "row", gap: scale(8) }}
          >
            {levels.map((level, idx) => {
              const isActive = selectedLevel === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    if (level.isAvailable) setSelectedLevel(idx);
                  }}
                  style={{
                    paddingVertical: verticalScale(12),
                    paddingHorizontal: scale(18),
                    borderRadius: scale(12),
                    backgroundColor: isActive
                      ? colors.primary
                      : colors.primaryLight,
                    minWidth: scale(100),
                    opacity: level.isAvailable ? 1 : 0.5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT13,
                      fontFamily: "Poppins_600SemiBold",
                      color: isActive ? "#fff" : colors.primary,
                      textAlign: "center",
                    }}
                  >
                    {t(`certSteps.levels.level${idx + 1}`)}
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSizes.FONT11,
                      fontFamily: "Poppins_400Regular",
                      color: isActive
                        ? "rgba(255,255,255,0.7)"
                        : colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {level.courses.length} {t("certSteps.levels.courses")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Courses in selected level */}
        {currentLevelData?.courses.map((course: LevelCourse, i: number) => {
          const courseUrl =
            course._links?.canonical?.href ||
            `${SASL_BASE}/ar/e/${course.id}`;
          return (
            <View
              key={course.id || i}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                padding: scale(14),
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: scale(12),
                marginBottom: verticalScale(8),
                backgroundColor: colors.card,
                opacity: !course.isFinished && !course.isAvailable ? 0.6 : 1,
              }}
            >
              {/* Course image/icon */}
              <View
                style={{
                  width: scale(50),
                  height: scale(50),
                  borderRadius: scale(8),
                  backgroundColor: colors.primaryLight,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: isRTL ? 0 : scale(12),
                  marginLeft: isRTL ? scale(12) : 0,
                  overflow: "hidden",
                }}
              >
                {course.event_pic_url ? (
                  <Image
                    source={{
                      uri: `${course.event_pic_url}?w=300&h=300`,
                    }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="book-outline"
                    size={scale(22)}
                    color={colors.primary}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: fontSizes.FONT13,
                    fontFamily: "Poppins_500Medium",
                    color: colors.text,
                    textAlign: isRTL ? "right" : "left",
                  }}
                  numberOfLines={2}
                >
                  {course.title}
                </Text>
                {course.modulesAmount > 0 && (
                  <Text
                    style={{
                      fontSize: fontSizes.FONT11,
                      fontFamily: "Poppins_400Regular",
                      color: colors.textSecondary,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {course.modulesAmount} {t("certSteps.levels.modules")}
                  </Text>
                )}
              </View>
              {/* Status / action */}
              {course.isFinished ? (
                <View
                  style={{
                    backgroundColor: colors.successBg,
                    paddingVertical: verticalScale(6),
                    paddingHorizontal: scale(12),
                    borderRadius: scale(8),
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="checkmark"
                    size={scale(14)}
                    color={colors.success}
                  />
                  <Text
                    style={{
                      fontSize: fontSizes.FONT11,
                      fontFamily: "Poppins_500Medium",
                      color: colors.success,
                      marginLeft: isRTL ? 0 : scale(4),
                      marginRight: isRTL ? scale(4) : 0,
                    }}
                  >
                    {t("certSteps.statuses.done")}
                  </Text>
                </View>
              ) : !course.isAvailable ? (
                <View
                  style={{
                    backgroundColor: colors.stepDisabled,
                    paddingVertical: verticalScale(6),
                    paddingHorizontal: scale(12),
                    borderRadius: scale(8),
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={scale(14)}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={{
                      fontSize: fontSizes.FONT11,
                      fontFamily: "Poppins_500Medium",
                      color: colors.textSecondary,
                      marginLeft: isRTL ? 0 : scale(4),
                      marginRight: isRTL ? scale(4) : 0,
                    }}
                  >
                    {t("certSteps.statuses.closed")}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    openWebView(courseUrl, course.title)
                  }
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: verticalScale(6),
                    paddingHorizontal: scale(14),
                    borderRadius: scale(8),
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT12,
                      fontFamily: "Poppins_500Medium",
                      color: "#fff",
                    }}
                  >
                    {t("certSteps.actions.startNow")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {levels.length === 0 && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: verticalScale(20),
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text
                style={{
                  fontSize: fontSizes.FONT13,
                  fontFamily: "Poppins_400Regular",
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                {t("certSteps.levels.subtitle")}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // ══════════════════════════════════════════════════════════
  //  STEP 4: Certification Test
  //  (mirrors UserCertificationTest.vue)
  // ══════════════════════════════════════════════════════════

  const handleBookAppointment = async () => {
    if (!userId || !selectedDateId) return;
    try {
      await saslPost(
        `/api/v2/users/${userId}/type/${APPOINTMENT_TYPE_ID}/appointments`,
        { appointmentID: selectedDateId }
      );
      setSelectedDateId(null);
      // Refresh appointments
      fetchTestData();
    } catch (err: any) {
      Alert.alert(
        t("certSteps.test.heading"),
        err?.response?.data?.message || "Error booking appointment"
      );
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!userId) return;
    try {
      await saslDelete(
        `/api/v2/users/${userId}/type/${APPOINTMENT_TYPE_ID}/appointments/${appointmentId}`
      );
      fetchTestData();
    } catch {
    }
  };

  const fetchTestData = async () => {
    if (!userId) return;
    setIsAppointmentsLoading(true);
    setIsDatesLoading(true);
    try {
      const apptRes = await saslApi(
        `/api/v2/users/${userId}/type/${APPOINTMENT_TYPE_ID}/appointments/1`
      );
      const appts: AppointmentData[] = apptRes.data?.data || [];
      setAppointments(appts);
      const passed = appts.some((a) => a.status === 3);
      const expired = appts[0]?.is_expired || false;
      setTestPassed(passed);
      setCertExpired(expired);
      setReservedAppointments(
        appts.filter((a) => +new Date(a.appointment.date) > Date.now())
      );

      if (passed && !expired) {
        updateStepStatus(3, {
          id: 3,
          title: "certSteps.statuses.passed",
          color: "success",
        });
      }
    } catch {
      /* ignore */
    }
    setIsAppointmentsLoading(false);

    try {
      const datesRes = await saslApi(
        `/api/v2/users/${userId}/type/${APPOINTMENT_TYPE_ID}/appointments`
      );
      const dates: AvailableDate[] = datesRes.data?.data || [];
      const unique = dates.filter(
        (d, i, self) => i === self.findIndex((t) => t.date === d.date)
      );
      setAvailableDates(
        unique.filter((d) => d.total_seats > d.reserved_seats)
      );
    } catch {
      /* ignore */
    }
    setIsDatesLoading(false);
  };

  const canCancelAppointment = (appointmentDate: string): boolean => {
    const now = new Date();
    const apptDate = new Date(appointmentDate);
    const diffMs = Math.abs(apptDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 2;
  };

  const renderTest = () => (
    <View>
      <Text
        style={{
          fontSize: fontSizes.FONT20,
          fontFamily: "Poppins_700Bold",
          color: colors.text,
          marginBottom: verticalScale(16),
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {t("certSteps.test.heading")}
      </Text>

      {/* Success: passed */}
      {testPassed && !certExpired && (
        <SuccessAlert
          heading={t("certSteps.test.successHeading")}
          subtitle={t("certSteps.test.successSubtitle")}
          buttonLabel={t("certSteps.actions.getCertificate")}
          onPress={() => goToStep(4)}
        />
      )}

      {/* Date picker - show when no reserved and not passed (or expired + renewal booked) */}
      {(!testPassed || certExpired) &&
        (reservedAppointments.length === 0) && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: scale(14),
              padding: scale(16),
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: verticalScale(12),
            }}
          >
            <Text
              style={{
                fontSize: fontSizes.FONT15,
                fontFamily: "Poppins_600SemiBold",
                color: colors.text,
                marginBottom: verticalScale(4),
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {t("certSteps.test.bookTitle")}
            </Text>
            <Text
              style={{
                fontSize: fontSizes.FONT12,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                marginBottom: verticalScale(12),
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {t("certSteps.test.bookSubtitle")}
            </Text>

            {isDatesLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                {/* Available dates */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    gap: scale(8),
                    marginBottom: verticalScale(12),
                  }}
                >
                  {availableDates.map((d) => {
                    const isSelected = selectedDateId === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => setSelectedDateId(d.id)}
                        style={{
                          paddingVertical: verticalScale(10),
                          paddingHorizontal: scale(14),
                          borderRadius: scale(10),
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.primaryLight,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: fontSizes.FONT12,
                            fontFamily: "Poppins_500Medium",
                            color: isSelected ? "#fff" : colors.text,
                            textAlign: "center",
                          }}
                        >
                          {new Date(d.date).toLocaleDateString("ar-SA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        <Text
                          style={{
                            fontSize: fontSizes.FONT10,
                            fontFamily: "Poppins_400Regular",
                            color: isSelected
                              ? "rgba(255,255,255,0.7)"
                              : colors.textSecondary,
                            textAlign: "center",
                          }}
                        >
                          {new Date(d.date).toLocaleTimeString("ar-SA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Submit button */}
                <TouchableOpacity
                  onPress={handleBookAppointment}
                  disabled={!selectedDateId}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: selectedDateId
                      ? colors.primary
                      : colors.stepDisabled,
                    paddingVertical: verticalScale(12),
                    borderRadius: scale(10),
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT14,
                      fontFamily: "Poppins_600SemiBold",
                      color: selectedDateId ? "#fff" : colors.textSecondary,
                    }}
                  >
                    {t("certSteps.actions.submit")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

      {/* Reserved appointments */}
      {reservedAppointments.length > 0 && (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: scale(14),
            padding: scale(16),
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: fontSizes.FONT15,
              fontFamily: "Poppins_600SemiBold",
              color: colors.text,
              marginBottom: verticalScale(4),
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {t("certSteps.test.reserved")}
          </Text>
          <Text
            style={{
              fontSize: fontSizes.FONT12,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
              marginBottom: verticalScale(12),
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {t("certSteps.test.reservedSubtitle")}
          </Text>
          {reservedAppointments.map((appt, i) => {
            const canCancel = canCancelAppointment(appt.appointment.date);
            return (
              <View
                key={i}
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  padding: scale(12),
                  backgroundColor: colors.primaryLight,
                  borderRadius: scale(10),
                  marginBottom: verticalScale(8),
                }}
              >
                <Ionicons
                  name="calendar"
                  size={scale(18)}
                  color={colors.primary}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: fontSizes.FONT13,
                    fontFamily: "Poppins_500Medium",
                    color: colors.text,
                    marginLeft: isRTL ? 0 : scale(10),
                    marginRight: isRTL ? scale(10) : 0,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {new Date(appt.appointment.date).toLocaleDateString(
                    "ar-SA",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    handleCancelAppointment(appt.appointment.id)
                  }
                  disabled={!canCancel}
                  style={{
                    backgroundColor: canCancel
                      ? colors.error
                      : colors.stepDisabled,
                    paddingVertical: verticalScale(6),
                    paddingHorizontal: scale(12),
                    borderRadius: scale(8),
                    opacity: canCancel ? 1 : 0.4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT11,
                      fontFamily: "Poppins_500Medium",
                      color: canCancel ? "#fff" : colors.textSecondary,
                    }}
                  >
                    {t("certSteps.actions.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Meeting link if available */}
          {reservedAppointments[0]?.appointment?.link && (
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(reservedAppointments[0].appointment.link!)
              }
              activeOpacity={0.8}
              style={{ marginTop: verticalScale(8) }}
            >
              <LinearGradient
                colors={["#1e7bb9", "#0f64a7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: verticalScale(44),
                  borderRadius: scale(10),
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: fontSizes.FONT14,
                    fontFamily: "Poppins_600SemiBold",
                    color: "#fff",
                  }}
                >
                  {t("certSteps.actions.startTest")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // ══════════════════════════════════════════════════════════
  //  STEP 5: Accreditation Certificate
  //  (mirrors UserAccreditationProgramCertificate.vue)
  // ══════════════════════════════════════════════════════════

  const hasRequiredAccredInfo =
    !!savedArName && !!savedEnName && !!mainCourseBooking?.id;

  const handleSaveNames = async () => {
    if (!userId || !arName.trim() || !enName.trim()) return;
    setAccredLoading(true);
    try {
      await saslPatch(`/api/v2/users/${userId}`, {
        id: userId,
        ar_name: arName.trim(),
        en_name: enName.trim(),
      });

      setSavedArName(arName.trim());
      setSavedEnName(enName.trim());

      // Generate certificate
      if (mainCourseBooking?.id) {
        const certRes = await saslApi(
          `/api/v2/users/${userId}/bookings/${mainCourseBooking.id}/files/accreditation_cert`
        );
        setCertificateUrl(certRes.data?.data?.file_url || null);
      }
    } catch {
    } finally {
      setAccredLoading(false);
    }
  };

  const renderAccreditation = () => (
    <View>
      <Text
        style={{
          fontSize: fontSizes.FONT20,
          fontFamily: "Poppins_700Bold",
          color: colors.text,
          marginBottom: verticalScale(16),
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {t("certSteps.accreditation.heading")}
      </Text>

      {accredLoading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginVertical: verticalScale(20) }}
        />
      ) : (
        <>
          {/* Name form (show when names not set) */}
          {!hasRequiredAccredInfo && (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: scale(14),
                padding: scale(16),
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: verticalScale(16),
              }}
            >
              <Text
                style={{
                  fontSize: fontSizes.FONT15,
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.text,
                  marginBottom: verticalScale(4),
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {t("certSteps.accreditation.formHeading")}
              </Text>
              <Text
                style={{
                  fontSize: fontSizes.FONT12,
                  fontFamily: "Poppins_400Regular",
                  color: colors.textSecondary,
                  marginBottom: verticalScale(16),
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {t("certSteps.accreditation.formSubtitle")}
              </Text>

              {/* Arabic name */}
              <View style={{ marginBottom: verticalScale(14) }}>
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: verticalScale(6),
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT13,
                      fontFamily: "Poppins_500Medium",
                      color: colors.text,
                    }}
                  >
                    {t("certSteps.accreditation.arabicName")}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: scale(12),
                      paddingVertical: verticalScale(2),
                      paddingHorizontal: scale(8),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSizes.FONT11,
                        fontFamily: "Poppins_500Medium",
                        color: "#fff",
                      }}
                    >
                      {NAMES_MAX_LENGTH - arName.length}
                    </Text>
                  </View>
                </View>
                <TextInput
                  value={arName}
                  onChangeText={(text) =>
                    text.length <= NAMES_MAX_LENGTH && setArName(text)
                  }
                  editable={!savedArName}
                  maxLength={NAMES_MAX_LENGTH}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: scale(10),
                    paddingVertical: verticalScale(12),
                    paddingHorizontal: scale(14),
                    fontSize: fontSizes.FONT14,
                    fontFamily: "Poppins_400Regular",
                    color: colors.text,
                    textAlign: "right",
                    writingDirection: "rtl",
                  }}
                  placeholder={t("certSteps.accreditation.arabicName")}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* English name */}
              <View style={{ marginBottom: verticalScale(14) }}>
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: verticalScale(6),
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT13,
                      fontFamily: "Poppins_500Medium",
                      color: colors.text,
                    }}
                  >
                    {t("certSteps.accreditation.englishName")}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: scale(12),
                      paddingVertical: verticalScale(2),
                      paddingHorizontal: scale(8),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSizes.FONT11,
                        fontFamily: "Poppins_500Medium",
                        color: "#fff",
                      }}
                    >
                      {NAMES_MAX_LENGTH - enName.length}
                    </Text>
                  </View>
                </View>
                <TextInput
                  value={enName}
                  onChangeText={(text) =>
                    text.length <= NAMES_MAX_LENGTH && setEnName(text)
                  }
                  editable={!savedEnName}
                  maxLength={NAMES_MAX_LENGTH}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: scale(10),
                    paddingVertical: verticalScale(12),
                    paddingHorizontal: scale(14),
                    fontSize: fontSizes.FONT14,
                    fontFamily: "Poppins_400Regular",
                    color: colors.text,
                    textAlign: "left",
                  }}
                  placeholder={t("certSteps.accreditation.englishName")}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                onPress={handleSaveNames}
                disabled={!arName.trim() || !enName.trim()}
                activeOpacity={0.8}
                style={{
                  backgroundColor:
                    arName.trim() && enName.trim()
                      ? colors.primary
                      : colors.stepDisabled,
                  paddingVertical: verticalScale(14),
                  borderRadius: scale(12),
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: fontSizes.FONT15,
                    fontFamily: "Poppins_600SemiBold",
                    color:
                      arName.trim() && enName.trim()
                        ? "#fff"
                        : colors.textSecondary,
                  }}
                >
                  {t("certSteps.actions.save")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Certificate preview (show when certificate URL exists) */}
          {certificateUrl && (
            <>
              <SuccessAlert
                heading={t("certSteps.accreditation.successHeading")}
                subtitle={t("certSteps.accreditation.successSubtitle")}
              />

              {savedArName && savedEnName && (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: scale(14),
                    padding: scale(16),
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSizes.FONT15,
                      fontFamily: "Poppins_600SemiBold",
                      color: colors.text,
                      marginBottom: verticalScale(12),
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {t("certSteps.accreditation.yourCertificate")}
                  </Text>

                  <TouchableOpacity
                    onPress={() => Linking.openURL(certificateUrl)}
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      padding: scale(12),
                      backgroundColor: colors.primaryLight,
                      borderRadius: scale(10),
                    }}
                  >
                    <Ionicons
                      name="document"
                      size={scale(24)}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: fontSizes.FONT13,
                        fontFamily: "Poppins_500Medium",
                        color: colors.primary,
                        marginLeft: isRTL ? 0 : scale(10),
                        marginRight: isRTL ? scale(10) : 0,
                        textAlign: isRTL ? "right" : "left",
                      }}
                    >
                      {`${name || savedEnName}`}
                    </Text>
                    <Ionicons
                      name="download-outline"
                      size={scale(20)}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );

  // ── Step renderers ─────────────────────────────────────
  const stepRenderers = [
    renderPayment,
    renderCertificates,
    renderLevels,
    renderTest,
    renderAccreditation,
  ];

  // ══════════════════════════════════════════════════════════
  //  TOUR / WALKTHROUGH
  // ══════════════════════════════════════════════════════════

  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const tourFade = useRef(new Animated.Value(0)).current;
  const tourSlide = useRef(new Animated.Value(30)).current;
  const { width: screenWidth } = Dimensions.get("window");

  useEffect(() => {
    if (!userId) return;
    const checkTour = async () => {
      const seen = await AsyncStorage.getItem(`tourSeen_${userId}`);
      if (!seen) setShowTour(true);
    };
    checkTour();
  }, [userId]);

  useEffect(() => {
    if (showTour) {
      tourFade.setValue(0);
      tourSlide.setValue(30);
      Animated.parallel([
        Animated.timing(tourFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(tourSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [showTour, tourStep]);

  const closeTour = async () => {
    if (userId) await AsyncStorage.setItem(`tourSeen_${userId}`, "true");
    setShowTour(false);
    setTourStep(0);
  };

  const tourSteps: any[] = (t("tour.steps") as any) || [];
  const tourStepColors = ["#1e7bb9", "#22c55e", "#8b5cf6", "#f59e0b", "#ef4444"];
  const tourStepBgColors = ["#e8f4f8", "#ecfdf5", "#f3e8ff", "#fef3c7", "#fef2f2"];

  const renderTourModal = () => (
    <Modal visible={showTour} transparent animationType="fade" onRequestClose={closeTour}>
      <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "center", alignItems: "center" }}>
        <Animated.View style={{
          width: screenWidth - scale(40),
          maxHeight: verticalScale(520),
          backgroundColor: isDark ? "#1a1d27" : "#ffffff",
          borderRadius: scale(24),
          overflow: "hidden",
          opacity: tourFade,
          transform: [{ translateY: tourSlide }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.25,
          shadowRadius: 24,
          elevation: 20,
        }}>
          {/* Top gradient accent */}
          <LinearGradient
            colors={[tourStepColors[tourStep] || "#1e7bb9", (tourStepColors[tourStep] || "#1e7bb9") + "cc"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: verticalScale(6) }}
          />

          {/* Skip button */}
          <TouchableOpacity
            onPress={closeTour}
            style={{
              position: "absolute",
              top: verticalScale(18),
              right: isRTL ? undefined : scale(18),
              left: isRTL ? scale(18) : undefined,
              zIndex: 10,
              paddingHorizontal: scale(12),
              paddingVertical: verticalScale(4),
              borderRadius: scale(12),
              backgroundColor: isDark ? "#2a2d3a" : "#f1f5f9",
            }}
          >
            <Text style={{ fontSize: fontSizes.FONT12, fontFamily: "Poppins_500Medium", color: colors.textSecondary }}>
              {t("tour.skip")}
            </Text>
          </TouchableOpacity>

          <View style={{ padding: scale(24), paddingTop: verticalScale(20) }}>
            {/* Step counter */}
            <Text style={{
              fontSize: fontSizes.FONT12, fontFamily: "Poppins_500Medium",
              color: tourStepColors[tourStep], textAlign: "center", marginBottom: verticalScale(12),
            }}>
              {tourStep + 1} {t("tour.stepOf")} {tourSteps.length}
            </Text>

            {/* Icon circle */}
            <View style={{ alignItems: "center", marginBottom: verticalScale(20) }}>
              <View style={{
                width: scale(80), height: scale(80), borderRadius: scale(40),
                backgroundColor: tourStepBgColors[tourStep] || "#e8f4f8",
                justifyContent: "center", alignItems: "center",
                borderWidth: 3, borderColor: tourStepColors[tourStep] || "#1e7bb9",
              }}>
                <Ionicons
                  name={(tourSteps[tourStep]?.icon || "help-circle-outline") as any}
                  size={scale(36)}
                  color={tourStepColors[tourStep] || "#1e7bb9"}
                />
              </View>
              {/* Step number badge */}
              <View style={{
                position: "absolute", bottom: -2, right: screenWidth / 2 - scale(60),
                width: scale(26), height: scale(26), borderRadius: scale(13),
                backgroundColor: tourStepColors[tourStep], justifyContent: "center", alignItems: "center",
                borderWidth: 2, borderColor: isDark ? "#1a1d27" : "#fff",
              }}>
                <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Poppins_700Bold" }}>{tourStep + 1}</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={{
              fontSize: fontSizes.FONT20, fontFamily: "Poppins_700Bold",
              color: colors.text, textAlign: "center", marginBottom: verticalScale(10),
            }}>
              {tourSteps[tourStep]?.title}
            </Text>

            {/* Description */}
            <Text style={{
              fontSize: fontSizes.FONT14, fontFamily: "Poppins_400Regular",
              color: colors.textSecondary, textAlign: "center",
              lineHeight: fontSizes.FONT14 * 1.7, paddingHorizontal: scale(8),
              marginBottom: verticalScale(24),
            }}>
              {tourSteps[tourStep]?.description}
            </Text>

            {/* Progress dots */}
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: verticalScale(20), gap: scale(6) }}>
              {tourSteps.map((_: any, i: number) => (
                <View
                  key={i}
                  style={{
                    width: i === tourStep ? scale(24) : scale(8),
                    height: scale(8),
                    borderRadius: scale(4),
                    backgroundColor: i === tourStep ? tourStepColors[i] : (isDark ? "#3a3d4a" : "#e2e8f0"),
                  }}
                />
              ))}
            </View>

            {/* Navigation buttons */}
            <View style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              {/* Prev button */}
              {tourStep > 0 ? (
                <TouchableOpacity
                  onPress={() => setTourStep(tourStep - 1)}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    paddingVertical: verticalScale(10),
                    paddingHorizontal: scale(16),
                    borderRadius: scale(12),
                    backgroundColor: isDark ? "#2a2d3a" : "#f1f5f9",
                  }}
                >
                  <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={scale(16)} color={colors.textSecondary} />
                  <Text style={{ fontSize: fontSizes.FONT14, fontFamily: "Poppins_500Medium", color: colors.textSecondary, marginHorizontal: scale(4) }}>
                    {t("tour.prev")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              {/* Next / Finish button */}
              <TouchableOpacity
                onPress={() => {
                  if (tourStep < tourSteps.length - 1) {
                    setTourStep(tourStep + 1);
                  } else {
                    closeTour();
                  }
                }}
              >
                <LinearGradient
                  colors={[tourStepColors[tourStep] || "#1e7bb9", (tourStepColors[tourStep] || "#1e7bb9") + "dd"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    paddingVertical: verticalScale(10),
                    paddingHorizontal: scale(20),
                    borderRadius: scale(12),
                  }}
                >
                  <Text style={{ fontSize: fontSizes.FONT14, fontFamily: "Poppins_600SemiBold", color: "#fff", marginHorizontal: scale(4) }}>
                    {tourStep < tourSteps.length - 1 ? t("tour.next") : t("tour.finish")}
                  </Text>
                  <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={scale(16)} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  // ══════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ══════════════════════════════════════════════════════════

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {renderHeader()}
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: verticalScale(12),
              fontSize: fontSizes.FONT14,
              color: colors.textSecondary,
              fontFamily: "Poppins_400Regular",
            }}
          >
            {t("common.loading")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {renderTourModal()}
      {renderHeader()}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottomTabBarHeight + verticalScale(20),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {renderStepNav()}
        <View
          style={{
            paddingHorizontal: scale(16),
            paddingTop: verticalScale(8),
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: scale(16),
              padding: scale(20),
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {stepRenderers[currentStep]()}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
