import {
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import React, { useMemo, useState } from "react";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { fontSizes, IsAndroid } from "@/themes/app.constant";
import { scale, verticalScale } from "react-native-size-matters";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useGetBookings, { Booking } from "@/hooks/fetch/useGetBookings";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type FilterType = "all" | "completed" | "active";

// ── Progress Bar ────────────────────────────
function ProgressBar({
  progress,
  bgColor,
}: {
  progress: number;
  bgColor: string;
}) {
  const clampedProgress = Math.min(Math.max(progress || 0, 0), 100);
  return (
    <View
      style={{
        height: scale(5),
        borderRadius: scale(3),
        backgroundColor: bgColor,
        overflow: "hidden",
        flex: 1,
      }}
    >
      <LinearGradient
        colors={
          clampedProgress === 100
            ? ["#22c55e", "#16a34a"]
            : ["#3b82f6", "#1e7bb9"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: "100%",
          width: `${clampedProgress}%`,
          borderRadius: scale(3),
        }}
      />
    </View>
  );
}

// ── Booking Card ────────────────────────────
function BookingCard({
  item,
  isDark,
  colors,
  isRTL,
  t,
}: {
  item: Booking;
  isDark: boolean;
  colors: any;
  isRTL: boolean;
  t: (key: string) => string;
}) {
  const progress = item.progress || 0;
  const isComplete = progress === 100;
  const modulesCount = item.modules?.amount || 0;
  const title =
    item.service?.title || item.title || `${t("enrolled.course")} #${item.service_id}`;
  const imageUrl =
    item.service?.event_pic_url || item.event_pic_url || null;
  const courseUrl =
    item.service?._links?.canonical?.href || item.canonical_url || null;

  const statusColor = isComplete ? "#22c55e" : "#3b82f6";
  const statusBg = isComplete
    ? isDark
      ? "rgba(34,197,94,0.15)"
      : "#f0fdf4"
    : isDark
    ? "rgba(59,130,246,0.15)"
    : "#eff6ff";

  const handlePress = () => {
    if (courseUrl) {
      router.push({
        pathname: "/(routes)/webview",
        params: { url: courseUrl, title: title },
      } as any);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={{
        marginHorizontal: scale(16),
        marginBottom: verticalScale(14),
        borderRadius: scale(16),
        backgroundColor: colors.card,
        shadowColor: isDark ? "#000" : "#94a3b8",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 10,
        elevation: 4,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      }}
    >
      {/* Course Image - NO fade overlay */}
      {imageUrl ? (
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: "100%",
              height: verticalScale(130),
            }}
            resizeMode="cover"
          />
          {/* Status Badge */}
          <View
            style={{
              position: "absolute",
              top: scale(10),
              [isRTL ? "left" : "right"]: scale(10),
              backgroundColor: statusBg,
              paddingHorizontal: scale(10),
              paddingVertical: scale(4),
              borderRadius: scale(20),
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isComplete
                ? "rgba(34,197,94,0.2)"
                : "rgba(59,130,246,0.2)",
            }}
          >
            <Ionicons
              name={isComplete ? "checkmark-circle" : "time-outline"}
              size={scale(12)}
              color={statusColor}
            />
            <Text
              style={{
                fontSize: fontSizes.FONT11,
                fontFamily: "Poppins_600SemiBold",
                color: statusColor,
                marginLeft: isRTL ? 0 : scale(4),
                marginRight: isRTL ? scale(4) : 0,
              }}
            >
              {isComplete ? t("enrolled.completed") : t("enrolled.inProgress")}
            </Text>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={isDark ? ["#1e2130", "#2a2d3a"] : ["#e0edf7", "#cde0f0"]}
          style={{
            width: "100%",
            height: verticalScale(90),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons
            name="book-open-page-variant-outline"
            size={scale(36)}
            color={isDark ? "#64748b" : "#94a3b8"}
          />
        </LinearGradient>
      )}

      {/* Card Content */}
      <View style={{ padding: scale(14) }}>
        {/* Title */}
        <Text
          numberOfLines={2}
          style={{
            fontSize: fontSizes.FONT15,
            fontFamily: "Poppins_600SemiBold",
            color: colors.text,
            textAlign: isRTL ? "right" : "left",
            lineHeight: 22,
            marginBottom: verticalScale(10),
          }}
        >
          {title}
        </Text>

        {/* Stats Row */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            marginBottom: verticalScale(10),
            flexWrap: "wrap",
            gap: scale(6),
          }}
        >
          {modulesCount > 0 && (
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(148,163,184,0.08)" : "#f1f5f9",
                paddingHorizontal: scale(8),
                paddingVertical: scale(4),
                borderRadius: scale(8),
              }}
            >
              <Feather name="layers" size={scale(11)} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: fontSizes.FONT11,
                  fontFamily: "Poppins_500Medium",
                  color: colors.textSecondary,
                  marginLeft: isRTL ? 0 : scale(4),
                  marginRight: isRTL ? scale(4) : 0,
                }}
              >
                {modulesCount} {t("enrolled.modules")}
              </Text>
            </View>
          )}

          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              backgroundColor: statusBg,
              paddingHorizontal: scale(8),
              paddingVertical: scale(4),
              borderRadius: scale(8),
            }}
          >
            <Ionicons name="stats-chart" size={scale(11)} color={statusColor} />
            <Text
              style={{
                fontSize: fontSizes.FONT11,
                fontFamily: "Poppins_600SemiBold",
                color: statusColor,
                marginLeft: isRTL ? 0 : scale(4),
                marginRight: isRTL ? scale(4) : 0,
              }}
            >
              {progress}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
          }}
        >
          <ProgressBar
            progress={progress}
            bgColor={isDark ? "#2a2d3a" : "#e2e8f0"}
          />
          {isComplete && (
            <Ionicons
              name="checkmark-circle"
              size={scale(16)}
              color="#22c55e"
              style={{
                marginLeft: isRTL ? 0 : scale(8),
                marginRight: isRTL ? scale(8) : 0,
              }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Skeleton Loader ─────────────────────────
function BookingSkeleton({ isDark }: { isDark: boolean }) {
  const bg = isDark ? "#1a1d27" : "#ffffff";
  const shimmer = isDark ? "#2a2d3a" : "#e2e8f0";
  return (
    <View
      style={{
        marginHorizontal: scale(16),
        marginBottom: verticalScale(14),
        borderRadius: scale(16),
        backgroundColor: bg,
        overflow: "hidden",
        elevation: 2,
      }}
    >
      <View
        style={{
          width: "100%",
          height: verticalScale(130),
          backgroundColor: shimmer,
        }}
      />
      <View style={{ padding: scale(14) }}>
        <View
          style={{
            width: "75%",
            height: scale(14),
            backgroundColor: shimmer,
            borderRadius: scale(7),
            marginBottom: verticalScale(10),
          }}
        />
        <View
          style={{
            width: "45%",
            height: scale(10),
            backgroundColor: shimmer,
            borderRadius: scale(5),
            marginBottom: verticalScale(10),
          }}
        />
        <View
          style={{
            width: "100%",
            height: scale(5),
            backgroundColor: shimmer,
            borderRadius: scale(3),
          }}
        />
      </View>
    </View>
  );
}

// ── Empty State ─────────────────────────────
function EmptyState({
  isDark,
  colors,
  t,
  filter,
}: {
  isDark: boolean;
  colors: any;
  t: (key: string) => string;
  filter: FilterType;
}) {
  const isFiltered = filter !== "all";
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: verticalScale(50),
        paddingHorizontal: scale(32),
      }}
    >
      <View
        style={{
          width: scale(80),
          height: scale(80),
          borderRadius: scale(40),
          backgroundColor: isDark ? "rgba(59,130,246,0.1)" : "#eff6ff",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: verticalScale(16),
        }}
      >
        <MaterialCommunityIcons
          name={isFiltered ? "filter-off-outline" : "book-open-blank-variant"}
          size={scale(36)}
          color={isDark ? "#64748b" : "#94a3b8"}
        />
      </View>
      <Text
        style={{
          fontSize: fontSizes.FONT18,
          fontFamily: "Poppins_600SemiBold",
          color: colors.text,
          textAlign: "center",
          marginBottom: verticalScale(8),
        }}
      >
        {isFiltered ? t("enrolled.emptyFilterTitle") : t("enrolled.emptyTitle")}
      </Text>
      <Text
        style={{
          fontSize: fontSizes.FONT14,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        {isFiltered ? t("enrolled.emptyFilterSubtitle") : t("enrolled.emptySubtitle")}
      </Text>
    </View>
  );
}

// ── Filter Chip ─────────────────────────────
function FilterChip({
  label,
  count,
  icon,
  color,
  isActive,
  onPress,
  isDark,
  colors,
  isRTL,
}: {
  label: string;
  count: number;
  icon: string;
  color: string;
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
  colors: any;
  isRTL: boolean;
}) {
  const activeBg = isActive ? color : "transparent";
  const activeTextColor = isActive ? "#fff" : colors.textSecondary;
  const activeBorder = isActive ? color : isDark ? "#2a2d3a" : "#e2e8f0";
  const activeCountBg = isActive
    ? "rgba(255,255,255,0.25)"
    : isDark
    ? "rgba(148,163,184,0.1)"
    : "#f1f5f9";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(6),
        borderRadius: scale(14),
        backgroundColor: isActive
          ? isDark
            ? `${color}22`
            : `${color}12`
          : isDark
          ? "rgba(255,255,255,0.03)"
          : "rgba(0,0,0,0.02)",
        borderWidth: 1.5,
        borderColor: isActive ? color : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      }}
    >
      {/* Count */}
      <View
        style={{
          width: scale(36),
          height: scale(36),
          borderRadius: scale(18),
          backgroundColor: isActive ? color : activeCountBg,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: verticalScale(6),
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.FONT16,
            fontFamily: "Poppins_700Bold",
            color: isActive ? "#fff" : color,
          }}
        >
          {count}
        </Text>
      </View>

      {/* Label */}
      <Text
        style={{
          fontSize: fontSizes.FONT11,
          fontFamily: isActive ? "Poppins_600SemiBold" : "Poppins_500Medium",
          color: isActive ? color : colors.textSecondary,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Active indicator dot */}
      {isActive && (
        <View
          style={{
            width: scale(4),
            height: scale(4),
            borderRadius: scale(2),
            backgroundColor: color,
            marginTop: verticalScale(4),
          }}
        />
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ─────────────────────────────
export default function CoursesScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const isDark = theme.dark;
  const { bookings, loading, error, refetch } = useGetBookings();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const colors = {
    bg: isDark ? "#0f1117" : "#f8fafb",
    card: isDark ? "#1a1d27" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#2a2d3a" : "#e2e8f0",
    searchBg: isDark ? "#1a1d27" : "#ffffff",
    searchBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
  };

  const totalCount = bookings.length;
  const completedCount = bookings.filter((b) => b.progress === 100).length;
  const activeCount = bookings.filter((b) => b.progress >= 0 && b.progress < 100).length;

  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Filter by status
    switch (filter) {
      case "completed":
        result = result.filter((b) => b.progress === 100);
        break;
      case "active":
        result = result.filter((b) => b.progress >= 0 && b.progress < 100);
        break;
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((b) => {
        const title = (b.service?.title || b.title || "").toLowerCase();
        return title.includes(q);
      });
    }

    return result;
  }, [bookings, filter, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFilterPress = (newFilter: FilterType) => {
    setFilter((prev) => (prev === newFilter ? "all" : newFilter));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Title */}
      <View
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(2),
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.FONT24 || 24,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("enrolled.title")}
        </Text>
      </View>

      {/* Search Bar */}
      {!loading && bookings.length > 0 && (
        <View
          style={{
            paddingHorizontal: scale(16),
            paddingTop: verticalScale(8),
            paddingBottom: verticalScale(4),
          }}
        >
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              backgroundColor: colors.searchBg,
              borderRadius: scale(14),
              paddingHorizontal: scale(14),
              height: verticalScale(42),
              borderWidth: 1.5,
              borderColor: searchFocused
                ? isDark ? "#3b82f6" : "#1e7bb9"
                : colors.searchBorder,
              shadowColor: searchFocused ? "#3b82f6" : "transparent",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: searchFocused ? 0.1 : 0,
              shadowRadius: 8,
              elevation: searchFocused ? 3 : 0,
            }}
          >
            <Feather
              name="search"
              size={scale(16)}
              color={searchFocused
                ? (isDark ? "#60a5fa" : "#1e7bb9")
                : colors.textSecondary}
              style={{
                marginRight: isRTL ? 0 : scale(10),
                marginLeft: isRTL ? scale(10) : 0,
              }}
            />
            <TextInput
              placeholder={t("enrolled.searchPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1,
                fontSize: fontSizes.FONT14,
                fontFamily: "Poppins_400Regular",
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
                paddingVertical: 0,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close-circle"
                  size={scale(18)}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Filter Chips */}
      {!loading && bookings.length > 0 && (
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            paddingHorizontal: scale(16),
            paddingTop: verticalScale(8),
            paddingBottom: verticalScale(6),
            gap: scale(10),
          }}
        >
          <FilterChip
            label={t("enrolled.totalCourses")}
            count={totalCount}
            icon="book-open"
            color="#3b82f6"
            isActive={filter === "all"}
            onPress={() => setFilter("all")}
            isDark={isDark}
            colors={colors}
            isRTL={isRTL}
          />
          <FilterChip
            label={t("enrolled.completedCount")}
            count={completedCount}
            icon="checkmark-circle"
            color="#22c55e"
            isActive={filter === "completed"}
            onPress={() => handleFilterPress("completed")}
            isDark={isDark}
            colors={colors}
            isRTL={isRTL}
          />
          <FilterChip
            label={t("enrolled.inProgressCount")}
            count={activeCount}
            icon="time"
            color="#f59e0b"
            isActive={filter === "active"}
            onPress={() => handleFilterPress("active")}
            isDark={isDark}
            colors={colors}
            isRTL={isRTL}
          />
        </View>
      )}

      {/* Content */}
      {loading && !refreshing ? (
        <View style={{ paddingTop: verticalScale(10) }}>
          <BookingSkeleton isDark={isDark} />
          <BookingSkeleton isDark={isDark} />
          <BookingSkeleton isDark={isDark} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingTop: verticalScale(6),
            paddingBottom: verticalScale(100),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#64748b" : "#94a3b8"}
              colors={["#1e7bb9"]}
            />
          }
          renderItem={({ item }) => (
            <BookingCard
              item={item}
              isDark={isDark}
              colors={colors}
              isRTL={isRTL}
              t={t}
            />
          )}
          ListEmptyComponent={
            <EmptyState isDark={isDark} colors={colors} t={t} filter={filter} />
          }
        />
      )}
    </SafeAreaView>
  );
}
