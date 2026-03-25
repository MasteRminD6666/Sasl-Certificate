import {
  FlatList,
  StatusBar,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { scale, verticalScale } from "react-native-size-matters";
import { fontSizes } from "@/themes/app.constant";
import { Feather, Ionicons } from "@expo/vector-icons";
import AppHeader from "@/components/common/app-header";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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

// ── FAQ Item ────────────────────────────────
function FAQItem({
  question,
  answer,
  isExpanded,
  onToggle,
  isDark,
  colors,
  isRTL,
  index,
}: {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
  colors: any;
  isRTL: boolean;
  index: number;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={{
        backgroundColor: colors.card,
        borderRadius: scale(14),
        marginBottom: verticalScale(10),
        marginHorizontal: scale(16),
        borderWidth: 1,
        borderColor: isExpanded
          ? isDark
            ? "rgba(30,123,185,0.3)"
            : "rgba(30,123,185,0.15)"
          : colors.border,
        shadowColor: isDark ? "#000" : "#94a3b8",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.15 : 0.04,
        shadowRadius: 4,
        elevation: isExpanded ? 3 : 1,
        overflow: "hidden",
      }}
    >
      {/* Question Row */}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          paddingVertical: verticalScale(14),
          paddingHorizontal: scale(16),
        }}
      >
        {/* Number badge */}
        <View
          style={{
            width: scale(28),
            height: scale(28),
            borderRadius: scale(8),
            backgroundColor: isExpanded
              ? "#1e7bb9"
              : isDark
              ? "rgba(30,123,185,0.12)"
              : "#eef5fb",
            justifyContent: "center",
            alignItems: "center",
            marginRight: isRTL ? 0 : scale(12),
            marginLeft: isRTL ? scale(12) : 0,
          }}
        >
          <Text
            style={{
              fontSize: fontSizes.FONT11 || 11,
              fontFamily: "Poppins_600SemiBold",
              color: isExpanded
                ? "#fff"
                : isDark
                ? "#60a5fa"
                : "#1e7bb9",
            }}
          >
            {index + 1}
          </Text>
        </View>

        {/* Question Text */}
        <Text
          style={{
            flex: 1,
            fontSize: fontSizes.FONT14,
            fontFamily: "Poppins_500Medium",
            color: isExpanded
              ? isDark
                ? "#e0f2fe"
                : "#0c4a6e"
              : colors.text,
            textAlign: isRTL ? "right" : "left",
            lineHeight: 22,
          }}
        >
          {question}
        </Text>

        {/* Toggle icon */}
        <View
          style={{
            width: scale(26),
            height: scale(26),
            borderRadius: scale(13),
            backgroundColor: isExpanded
              ? isDark
                ? "rgba(30,123,185,0.2)"
                : "rgba(30,123,185,0.1)"
              : "transparent",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: isRTL ? 0 : scale(8),
            marginRight: isRTL ? scale(8) : 0,
          }}
        >
          <Feather
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={scale(16)}
            color={
              isExpanded
                ? "#1e7bb9"
                : colors.textSecondary
            }
          />
        </View>
      </View>

      {/* Answer (collapsible) */}
      {isExpanded && (
        <View
          style={{
            paddingHorizontal: scale(16),
            paddingBottom: verticalScale(16),
            paddingTop: 0,
            borderTopWidth: 1,
            borderTopColor: isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.04)",
            marginHorizontal: scale(8),
          }}
        >
          <Text
            style={{
              fontSize: fontSizes.FONT13,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
              textAlign: isRTL ? "right" : "left",
              lineHeight: 22,
              paddingTop: verticalScale(12),
            }}
          >
            {answer}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Empty State ─────────────────────────────
function EmptyState({
  isDark,
  colors,
  t,
}: {
  isDark: boolean;
  colors: any;
  t: (key: string) => string;
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
          width: scale(60),
          height: scale(60),
          borderRadius: scale(30),
          backgroundColor: isDark ? "rgba(59,130,246,0.1)" : "#eff6ff",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: verticalScale(14),
        }}
      >
        <Feather
          name="search"
          size={scale(26)}
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
        {t("faq.noResults")}
      </Text>
      <Text
        style={{
          fontSize: fontSizes.FONT13,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          textAlign: "center",
        }}
      >
        {t("faq.noResultsSubtitle")}
      </Text>
    </View>
  );
}

// ── Main Screen ─────────────────────────────
export default function FAQScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const isDark = theme.dark;

  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const colors = {
    bg: isDark ? "#0f1117" : "#f8fafb",
    card: isDark ? "#1a1d27" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    searchBg: isDark ? "#1a1d27" : "#ffffff",
    searchBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
  };

  // Get the questions array from translations
  const rawQuestions: any[] = t("faq.questions") as any;
  const questions: { category: number; question: string; answer: string }[] =
    Array.isArray(rawQuestions) ? rawQuestions : [];

  // Get categories from translations
  const categoriesObj: Record<string, string> =
    (t("faq.categories") as any) || {};
  const categoryEntries = Object.entries(categoriesObj).map(([key, label]) => ({
    id: Number(key),
    label: label as string,
  }));

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (selectedCategory !== null) {
      result = result.filter((q) => q.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.answer.toLowerCase().includes(query)
      );
    }

    return result;
  }, [questions, selectedCategory, searchQuery]);

  const toggleQuestion = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  const handleCategoryPress = (catId: number) => {
    setSelectedCategory((prev) => (prev === catId ? null : catId));
    setActiveQuestion(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={t("faq.title")} />

      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: scale(16),
          paddingTop: verticalScale(12),
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
              ? isDark
                ? "#3b82f6"
                : "#1e7bb9"
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
            color={
              searchFocused
                ? isDark
                  ? "#60a5fa"
                  : "#1e7bb9"
                : colors.textSecondary
            }
            style={{
              marginRight: isRTL ? 0 : scale(10),
              marginLeft: isRTL ? scale(10) : 0,
            }}
          />
          <TextInput
            placeholder={t("faq.searchPlaceholder")}
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

      {/* Category Chips */}
      {categoryEntries.length > 0 && (
        <View
          style={{
            paddingTop: verticalScale(8),
            paddingBottom: verticalScale(6),
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: scale(16),
              flexDirection: isRTL ? "row-reverse" : "row",
            }}
          >
            <CategoryChip
              label={t("faq.allCategories")}
              isActive={selectedCategory === null}
              onPress={() => {
                setSelectedCategory(null);
                setActiveQuestion(null);
              }}
              isDark={isDark}
              colors={colors}
            />
            {categoryEntries.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.label}
                isActive={selectedCategory === cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                isDark={isDark}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Questions count */}
      <View
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(4),
          paddingBottom: verticalScale(6),
        }}
      >
        <Text
          style={{
            fontSize: fontSizes.FONT12,
            fontFamily: "Poppins_500Medium",
            color: colors.textSecondary,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {filteredQuestions.length}{" "}
          {filteredQuestions.length === 1 ? "question" : "questions"}
        </Text>
      </View>

      {/* Questions List */}
      <FlatList
        data={filteredQuestions}
        keyExtractor={(_, index) => String(index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: verticalScale(100),
          paddingTop: verticalScale(2),
        }}
        renderItem={({ item, index }) => (
          <FAQItem
            question={item.question}
            answer={item.answer}
            isExpanded={activeQuestion === index}
            onToggle={() => toggleQuestion(index)}
            isDark={isDark}
            colors={colors}
            isRTL={isRTL}
            index={index}
          />
        )}
        ListEmptyComponent={
          <EmptyState isDark={isDark} colors={colors} t={t} />
        }
      />
    </View>
  );
}
