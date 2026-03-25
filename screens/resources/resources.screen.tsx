import {
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useMemo, useState, useRef } from "react";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { fontSizes, IsAndroid } from "@/themes/app.constant";
import { scale, verticalScale } from "react-native-size-matters";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useGetCatalog, { CatalogCourse } from "@/hooks/fetch/useGetCatalog";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - scale(48)) / 2;

// ── Course Card ─────────────────────────────
function CatalogCard({
  item,
  isDark,
  colors,
  isRTL,
  t,
}: {
  item: CatalogCourse;
  isDark: boolean;
  colors: any;
  isRTL: boolean;
  t: (key: string) => string;
}) {
  const title = item.title || "";
  const imageUrl = item.event_pic_url
    ? `${item.event_pic_url}?w=300&h=200`
    : null;
  const courseUrl = item._links?.canonical?.href || item.canonical_url || null;
  const isFree = !item.price || item.price === 0;
  const modulesCount = item.modules_count || 0;
  const tagName = item.tags?.[0]?.name || null;
  const price = item.price || 0;
  const originalPrice = item.original_price || 0;
  const hasDiscount = originalPrice > 0 && originalPrice > price;
  const progress = item.progress;
  const isEnrolled = progress !== undefined && progress !== null;
  const isCompleted = progress === 100;

  const handlePress = () => {
    if (courseUrl) {
      router.push({
        pathname: "/(routes)/webview",
        params: { url: courseUrl, title },
      } as any);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={{
        width: CARD_WIDTH,
        marginBottom: verticalScale(14),
        borderRadius: scale(14),
        backgroundColor: colors.card,
        shadowColor: isDark ? "#000" : "#94a3b8",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.06,
        shadowRadius: 8,
        elevation: 3,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      }}
    >
      {/* Image */}
      <View>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: "100%",
              height: verticalScale(90),
            }}
            resizeMode="cover"
          />
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
              size={scale(28)}
              color={isDark ? "#64748b" : "#94a3b8"}
            />
          </LinearGradient>
        )}

        {/* Tag Badge (top-left/right) */}
        {tagName && (
          <View
            style={{
              position: "absolute",
              top: scale(6),
              [isRTL ? "right" : "left"]: scale(6),
              backgroundColor: "rgba(30,123,185,0.88)",
              paddingHorizontal: scale(7),
              paddingVertical: scale(2),
              borderRadius: scale(6),
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Poppins_600SemiBold",
                color: "#fff",
              }}
              numberOfLines={1}
            >
              {tagName}
            </Text>
          </View>
        )}

        {/* Price Badge (top opposite corner) */}
        <View
          style={{
            position: "absolute",
            top: scale(6),
            [isRTL ? "left" : "right"]: scale(6),
            backgroundColor: isFree
              ? "rgba(34,197,94,0.9)"
              : "rgba(59,130,246,0.9)",
            paddingHorizontal: scale(7),
            paddingVertical: scale(2),
            borderRadius: scale(6),
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontFamily: "Poppins_600SemiBold",
              color: "#fff",
            }}
          >
            {isFree ? t("catalog.free") : `${price} ${t("catalog.sar")}`}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: scale(10), paddingBottom: scale(12) }}>
        {/* Title */}
        <Text
          numberOfLines={2}
          style={{
            fontSize: fontSizes.FONT12,
            fontFamily: "Poppins_600SemiBold",
            color: colors.text,
            textAlign: isRTL ? "right" : "left",
            lineHeight: 18,
            minHeight: verticalScale(30),
          }}
        >
          {title}
        </Text>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            marginVertical: verticalScale(6),
          }}
        />

        {/* Bottom row: modules + price info */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Modules count */}
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
            }}
          >
            <Feather
              name="layers"
              size={scale(11)}
              color={isDark ? "#60a5fa" : "#1e7bb9"}
            />
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Poppins_500Medium",
                color: colors.textSecondary,
                marginLeft: isRTL ? 0 : scale(4),
                marginRight: isRTL ? scale(4) : 0,
              }}
            >
              {modulesCount} {t("catalog.modules")}
            </Text>
          </View>

          {/* Discount / original price */}
          {hasDiscount && (
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                textDecorationLine: "line-through",
              }}
            >
              {originalPrice} {t("catalog.sar")}
            </Text>
          )}
        </View>

        {/* Enrolled status */}
        {isEnrolled && (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              marginTop: verticalScale(6),
            }}
          >
            <View
              style={{
                width: scale(8),
                height: scale(8),
                borderRadius: scale(4),
                backgroundColor: isCompleted ? "#22c55e" : "#f59e0b",
                marginRight: isRTL ? 0 : scale(5),
                marginLeft: isRTL ? scale(5) : 0,
              }}
            />
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Poppins_500Medium",
                color: isCompleted ? "#22c55e" : "#f59e0b",
              }}
            >
              {isCompleted ? t("catalog.completed") : `${progress}%`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Skeleton Grid ───────────────────────────
function CatalogSkeleton({ isDark }: { isDark: boolean }) {
  const shimmer = isDark ? "#2a2d3a" : "#e2e8f0";
  const bg = isDark ? "#1a1d27" : "#ffffff";
  return (
    <View
      style={{
        width: CARD_WIDTH,
        marginBottom: verticalScale(14),
        borderRadius: scale(14),
        backgroundColor: bg,
        overflow: "hidden",
        elevation: 1,
      }}
    >
      <View style={{ width: "100%", height: verticalScale(85), backgroundColor: shimmer }} />
      <View style={{ padding: scale(10) }}>
        <View style={{ width: "85%", height: scale(12), backgroundColor: shimmer, borderRadius: scale(6), marginBottom: verticalScale(6) }} />
        <View style={{ width: "55%", height: scale(10), backgroundColor: shimmer, borderRadius: scale(5) }} />
      </View>
    </View>
  );
}

// ── Category Chip ───────────────────────────
function CategoryChip({
  label,
  isActive,
  onPress,
  isDark,
  colors,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(7),
        borderRadius: scale(20),
        marginRight: scale(8),
        backgroundColor: isActive
          ? "#1e7bb9"
          : isDark
          ? "rgba(255,255,255,0.06)"
          : "#ffffff",
        borderWidth: 1,
        borderColor: isActive
          ? "#1e7bb9"
          : isDark
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.08)",
      }}
    >
      <Text
        style={{
          fontSize: fontSizes.FONT12,
          fontFamily: isActive ? "Poppins_600SemiBold" : "Poppins_500Medium",
          color: isActive ? "#fff" : colors.textSecondary,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Empty State ─────────────────────────────
function EmptyState({
  isDark,
  colors,
  t,
  hasSearch,
}: {
  isDark: boolean;
  colors: any;
  t: (key: string) => string;
  hasSearch: boolean;
}) {
  return (
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: verticalScale(50),
        paddingHorizontal: scale(32),
      }}
    >
      <View
        style={{
          width: scale(70),
          height: scale(70),
          borderRadius: scale(35),
          backgroundColor: isDark ? "rgba(59,130,246,0.1)" : "#eff6ff",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: verticalScale(14),
        }}
      >
        <Feather
          name={hasSearch ? "search" : "book-open"}
          size={scale(30)}
          color={isDark ? "#64748b" : "#94a3b8"}
        />
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
        {hasSearch ? t("catalog.noResults") : t("catalog.emptyTitle")}
      </Text>
      <Text
        style={{
          fontSize: fontSizes.FONT13,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        {hasSearch ? t("catalog.noResultsSubtitle") : t("catalog.emptySubtitle")}
      </Text>
    </View>
  );
}

// ── Main Screen ─────────────────────────────
export default function ResourcesScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const isDark = theme.dark;
  const { courses, categories, loading, refetch } = useGetCatalog();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const colors = {
    bg: isDark ? "#0f1117" : "#f8fafb",
    card: isDark ? "#1a1d27" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    searchBg: isDark ? "#1a1d27" : "#ffffff",
    searchBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
  };

  const filteredCourses = useMemo(() => {
    let result = courses;

    // Filter by category
    if (selectedCategory !== null) {
      result = result.filter((c) => {
        if (c.tags && Array.isArray(c.tags)) {
          return c.tags.some((tag: any) => tag.id === selectedCategory);
        }
        return c.tag_id === selectedCategory;
      });
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) =>
        (c.title || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [courses, selectedCategory, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCategoryPress = (catId: number) => {
    setSelectedCategory((prev) => (prev === catId ? null : catId));
  };

  const hasActiveFilter = searchQuery.trim().length > 0 || selectedCategory !== null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Title & Count */}
      <View
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(2),
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "baseline",
          justifyContent: "space-between",
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
          {t("catalog.title")}
        </Text>
        {!loading && (
          <Text
            style={{
              fontSize: fontSizes.FONT13,
              fontFamily: "Poppins_500Medium",
              color: colors.textSecondary,
            }}
          >
            {filteredCourses.length} {t("catalog.coursesCount")}
          </Text>
        )}
      </View>

      {/* Search Bar */}
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
            placeholder={t("catalog.searchPlaceholder")}
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
              <Ionicons name="close-circle" size={scale(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      {!loading && categories.length > 0 && (
        <View style={{ paddingTop: verticalScale(6), paddingBottom: verticalScale(4) }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: scale(16),
              flexDirection: isRTL ? "row-reverse" : "row",
            }}
          >
            {/* All chip */}
            <CategoryChip
              label={t("catalog.all")}
              isActive={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
              isDark={isDark}
              colors={colors}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.name}
                isActive={selectedCategory === cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                isDark={isDark}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {loading && !refreshing ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            paddingHorizontal: scale(16),
            paddingTop: verticalScale(10),
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <CatalogSkeleton key={i} isDark={isDark} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: scale(16),
          }}
          contentContainerStyle={{
            paddingTop: verticalScale(8),
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
            <CatalogCard
              item={item}
              isDark={isDark}
              colors={colors}
              isRTL={isRTL}
              t={t}
            />
          )}
          ListEmptyComponent={
            <EmptyState isDark={isDark} colors={colors} t={t} hasSearch={hasActiveFilter} />
          }
        />
      )}
    </SafeAreaView>
  );
}
