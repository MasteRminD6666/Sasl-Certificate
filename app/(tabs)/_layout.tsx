import {
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
} from "react-native";
import React, { useEffect } from "react";
import { useTheme } from "@/context/theme.context";
import { Tabs } from "expo-router";
import { Feather, Ionicons, Octicons } from "@expo/vector-icons";
import { scale, verticalScale } from "react-native-size-matters";
import { fontSizes, IsAndroid } from "@/themes/app.constant";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Tab order: Courses(0) | Resources(1) | HOME(2, center) | Profile(3)
// We reorder the Tabs.Screen so index=2 in the navigation state maps to the Home route
const TAB_ROUTES = [
  "courses/index",
  "resources/index",
  "index",
  "profile/index",
];

const TAB_BAR_HEIGHT = 64;
const CENTER_BUTTON_SIZE = 58;

// ── Animation types for each tab ───────────
type TabAnimation = "bounce" | "wiggle" | "flip" | "pop";

interface AnimatedTabIconProps {
  icon: string;
  iconFamily: "feather" | "ionicons" | "octicons";
  size: number;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
  animationType: TabAnimation;
}

function AnimatedTabIcon({
  icon,
  iconFamily,
  size,
  focused,
  activeColor,
  inactiveColor,
  animationType,
}: AnimatedTabIconProps) {
  const scaleAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);
  const translateYAnim = useSharedValue(0);
  const focusAnim = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    // Smooth focus transition for color/baseline
    focusAnim.value = withTiming(focused ? 1 : 0, { duration: 200 });

    if (focused) {
      // Trigger the unique animation on select
      switch (animationType) {
        case "bounce":
          // Quick bounce up then settle
          translateYAnim.value = withSequence(
            withTiming(-8, { duration: 120, easing: Easing.out(Easing.quad) }),
            withSpring(0, { damping: 8, stiffness: 200 })
          );
          scaleAnim.value = withSequence(
            withTiming(1.3, { duration: 120 }),
            withSpring(1.15, { damping: 10, stiffness: 180 })
          );
          break;

        case "wiggle":
          // Wiggle rotation left-right
          scaleAnim.value = withSpring(1.15, { damping: 12, stiffness: 180 });
          rotateAnim.value = withSequence(
            withTiming(-12, { duration: 80 }),
            withTiming(12, { duration: 80 }),
            withTiming(-8, { duration: 70 }),
            withTiming(8, { duration: 70 }),
            withSpring(0, { damping: 12, stiffness: 200 })
          );
          translateYAnim.value = withTiming(-3, { duration: 150 });
          break;

        case "flip":
          // Flip on Y axis effect (simulated with scale X squeeze)
          scaleAnim.value = withSequence(
            withTiming(0.6, { duration: 100 }),
            withTiming(1.25, { duration: 150, easing: Easing.out(Easing.back(2)) }),
            withSpring(1.15, { damping: 10, stiffness: 160 })
          );
          translateYAnim.value = withSequence(
            withTiming(-5, { duration: 100 }),
            withSpring(-3, { damping: 12 })
          );
          break;

        case "pop":
          // Pop in with overshoot
          scaleAnim.value = withSequence(
            withTiming(0.7, { duration: 80 }),
            withTiming(1.35, { duration: 150, easing: Easing.out(Easing.back(3)) }),
            withSpring(1.15, { damping: 8, stiffness: 160 })
          );
          translateYAnim.value = withSequence(
            withTiming(-10, { duration: 120 }),
            withSpring(-3, { damping: 10, stiffness: 180 })
          );
          break;
      }
    } else {
      // Animate back to rest
      scaleAnim.value = withSpring(1, { damping: 14, stiffness: 180 });
      rotateAnim.value = withTiming(0, { duration: 200 });
      translateYAnim.value = withSpring(0, { damping: 14, stiffness: 180 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnim.value },
      { translateY: translateYAnim.value },
      { rotate: `${rotateAnim.value}deg` },
    ],
  }));

  const color = focused ? activeColor : inactiveColor;

  const IconComponent =
    iconFamily === "feather"
      ? Feather
      : iconFamily === "ionicons"
      ? Ionicons
      : Octicons;

  return (
    <Animated.View style={animatedStyle}>
      <IconComponent name={icon as any} size={size} color={color} />
    </Animated.View>
  );
}

// ── Animated Dot Indicator ─────────────────
function DotIndicator({ focused }: { focused: boolean }) {
  const dotWidth = useSharedValue(focused ? 16 : 0);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (focused) {
      dotOpacity.value = withTiming(1, { duration: 200 });
      dotWidth.value = withSequence(
        withTiming(6, { duration: 100 }),
        withSpring(16, { damping: 12, stiffness: 200 })
      );
    } else {
      dotWidth.value = withTiming(0, { duration: 150 });
      dotOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [focused]);

  const dotStyle = useAnimatedStyle(() => ({
    width: dotWidth.value,
    opacity: dotOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: 3,
          borderRadius: 1.5,
          backgroundColor: "#1e7bb9",
          marginTop: 5,
        },
        dotStyle,
      ]}
    />
  );
}

// ── Center Home Button ─────────────────────
function CenterHomeButton({
  focused,
  onPress,
}: {
  focused: boolean;
  onPress: () => void;
}) {
  const buttonTranslateY = useSharedValue(-10);
  const buttonScale = useSharedValue(0.95);
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      // Button lifts up
      buttonTranslateY.value = withSpring(-14, { damping: 14, stiffness: 170 });
      buttonScale.value = withSpring(1, { damping: 14, stiffness: 170 });

      // Icon does a pop + wiggle
      iconScale.value = withSequence(
        withTiming(0.6, { duration: 80 }),
        withTiming(1.3, { duration: 150, easing: Easing.out(Easing.back(3)) }),
        withSpring(1, { damping: 8, stiffness: 160 })
      );
      iconRotate.value = withSequence(
        withDelay(80, withTiming(-15, { duration: 70 })),
        withTiming(15, { duration: 70 }),
        withTiming(-10, { duration: 60 }),
        withSpring(0, { damping: 12, stiffness: 200 })
      );
    } else {
      buttonTranslateY.value = withSpring(-10, { damping: 14, stiffness: 170 });
      buttonScale.value = withSpring(0.95, { damping: 14, stiffness: 170 });
      iconScale.value = withSpring(1, { damping: 14, stiffness: 180 });
      iconRotate.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: buttonTranslateY.value },
      { scale: buttonScale.value },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.centerButtonWrapper}
    >
      <Animated.View style={[styles.centerButton, buttonStyle]}>
        <LinearGradient
          colors={focused ? ["#2196F3", "#1e7bb9"] : ["#64b5f6", "#42a5f5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.centerGradient}
        >
          <Animated.View style={iconStyle}>
            <Feather name="home" size={24} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Animated Tab Button (press feedback) ───
function AnimatedTabButton({
  onPress,
  children,
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
}) {
  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.85, { duration: 80 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={[{ alignItems: "center" }, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Custom Tab Bar Component ───────────────
function CustomTabBar({ state, navigation }: any) {
  const { theme } = useTheme();
  const isDark = theme.dark;

  const barBg = isDark ? "#1a1d27" : "#ffffff";
  const activeColor = "#1e7bb9";
  const inactiveColor = isDark ? "#6b7280" : "#9ca3af";
  const barWidth = SCREEN_WIDTH - scale(24);
  const barLeft = scale(12);

  // Tab configuration (order: Courses, Resources, HOME, Profile)
  // Each tab gets a unique animation: bounce, wiggle, flip, pop
  const tabConfig = [
    { icon: "book-open", family: "feather" as const, label: "Courses", anim: "bounce" as TabAnimation },
    { icon: "document-text-outline", family: "ionicons" as const, label: "Resources", anim: "wiggle" as TabAnimation },
    { icon: "home", family: "feather" as const, label: "Home", isCenter: true, anim: "pop" as TabAnimation },
    { icon: "person", family: "octicons" as const, label: "Profile", anim: "flip" as TabAnimation },
  ];

  return (
    <View
      style={[
        styles.tabBarOuter,
        {
          bottom: verticalScale(IsAndroid ? 10 : 24),
          left: barLeft,
          width: barWidth,
        },
      ]}
    >
      {/* Shadow layer */}
      <View
        style={[
          styles.tabBarShadow,
          {
            backgroundColor: barBg,
            shadowColor: isDark ? "#000" : "#475569",
          },
        ]}
      />

      {/* Tab bar background with SVG notch */}
      <Svg
        width={barWidth}
        height={TAB_BAR_HEIGHT + 14}
        style={{ position: "absolute", top: -14 }}
      >
        <Path
          d={generateNotchedPath(barWidth, TAB_BAR_HEIGHT + 14, CENTER_BUTTON_SIZE / 2 + 12)}
          fill={barBg}
        />
      </Svg>

      {/* Tab items */}
      <View style={styles.tabItemsRow}>
        {tabConfig.map((tab, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(TAB_ROUTES[index]);
            }
          };

          if (tab.isCenter) {
            return (
              <CenterHomeButton
                key={index}
                focused={isFocused}
                onPress={onPress}
              />
            );
          }

          return (
            <AnimatedTabButton
              key={index}
              onPress={onPress}
              style={styles.tabItem}
            >
              <AnimatedTabIcon
                icon={tab.icon}
                iconFamily={tab.family}
                size={22}
                focused={isFocused}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
                animationType={tab.anim}
              />
              <DotIndicator focused={isFocused} />
            </AnimatedTabButton>
          );
        })}
      </View>
    </View>
  );
}

// ── Generate SVG path with center notch ────
function generateNotchedPath(
  width: number,
  height: number,
  notchRadius: number
): string {
  const r = 22; // corner radius
  const cx = width / 2; // center x
  const nr = notchRadius; // notch radius
  const notchDepth = nr + 6;
  const notchWidth = nr * 2.4;
  const topY = 14; // offset from top for notch space

  return `
    M ${r} ${topY}
    L ${cx - notchWidth} ${topY}
    C ${cx - notchWidth + 14} ${topY} ${cx - nr - 4} ${topY - notchDepth + 10} ${cx - nr + 2} ${topY - notchDepth + 2}
    A ${nr} ${nr} 0 0 1 ${cx + nr - 2} ${topY - notchDepth + 2}
    C ${cx + nr + 4} ${topY - notchDepth + 10} ${cx + notchWidth - 14} ${topY} ${cx + notchWidth} ${topY}
    L ${width - r} ${topY}
    A ${r} ${r} 0 0 1 ${width} ${topY + r}
    L ${width} ${height - r}
    A ${r} ${r} 0 0 1 ${width - r} ${height}
    L ${r} ${height}
    A ${r} ${r} 0 0 1 0 ${height - r}
    L 0 ${topY + r}
    A ${r} ${r} 0 0 1 ${r} ${topY}
    Z
  `;
}

// ── Main Layout ────────────────────────────
export default function TabsLayout() {
  const { theme } = useTheme();
  const isDark = theme.dark;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        headerTitle: "",
        headerTitleStyle: {
          color: isDark ? "#fff" : "#000",
          textAlign: "center" as const,
          width: scale(320),
          fontSize: fontSizes.FONT22,
          fontFamily: "Poppins_400Regular",
        },
        headerBackgroundContainerStyle: {
          backgroundColor: isDark ? "#131313" : "#fff",
          shadowColor: isDark ? "#fff" : "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 1,
          elevation: 1,
        },
        tabBarShowLabel: false,
      })}
    >
      <Tabs.Screen name="courses/index" />
      <Tabs.Screen name="resources/index" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile/index" />
    </Tabs>
  );
}

// ── Styles ─────────────────────────────────
const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBarShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    top: 0,
  },
  tabItemsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: TAB_BAR_HEIGHT,
    width: "100%",
    paddingHorizontal: scale(8),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_BAR_HEIGHT,
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    shadowColor: "#1e7bb9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  centerGradient: {
    width: "100%",
    height: "100%",
    borderRadius: CENTER_BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
