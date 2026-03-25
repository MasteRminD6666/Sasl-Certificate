import React, { useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const SPLASH_BG = "#e8f4f8";
const BRAND_COLOR = "#1e7bb9";

interface AnimatedSplashScreenProps {
  isAppReady: boolean;
  onAnimationComplete: () => void;
  children: React.ReactNode;
}

export default function AnimatedSplashScreen({
  isAppReady,
  onAnimationComplete,
  children,
}: AnimatedSplashScreenProps) {
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);
  const shimmerProgress = useSharedValue(0);

  const onFinish = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  // Phase 1: Entrance animation (runs immediately)
  useEffect(() => {
    // Logo fades in and scales up with a spring
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 12, stiffness: 120 })
    );

    // Text fades in and slides up after logo
    textOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
    textTranslateY.value = withDelay(
      500,
      withSpring(0, { damping: 12, stiffness: 100 })
    );

    // Subtle shimmer across the logo
    shimmerProgress.value = withDelay(
      800,
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })
    );
  }, []);

  // Phase 2: Exit animation (runs when app is ready)
  useEffect(() => {
    if (isAppReady) {
      // Scale the logo up slightly before fading out
      logoScale.value = withTiming(1.15, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });

      // Fade everything out
      containerOpacity.value = withDelay(
        200,
        withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }, () => {
          runOnJS(onFinish)();
        })
      );
    }
  }, [isAppReady]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-width, width]
    );
    return {
      transform: [{ translateX }],
      opacity: interpolate(shimmerProgress.value, [0, 0.5, 1], [0, 0.3, 0]),
    };
  });

  return (
    <View style={styles.root}>
      {/* App content renders underneath */}
      {isAppReady && (
        <View style={StyleSheet.absoluteFill}>{children}</View>
      )}

      {/* Animated splash overlay */}
      <Animated.View
        style={[styles.splashContainer, containerAnimatedStyle]}
        pointerEvents={isAppReady ? "none" : "auto"}
      >
        <StatusBar barStyle="dark-content" backgroundColor={SPLASH_BG} />

        {/* Logo with animation */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Shimmer overlay */}
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </Animated.View>

        {/* Brand text */}
        <Animated.Text style={[styles.brandText, textAnimatedStyle]}>
          SASL
        </Animated.Text>
        <Animated.Text style={[styles.tagline, textAnimatedStyle]}>
          
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BG,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  logoContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 32,
  },
  logo: {
    width: 160,
    height: 160,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    width: 80,
  },
  brandText: {
    marginTop: 24,
    fontSize: 36,
    fontWeight: "700",
    color: BRAND_COLOR,
    letterSpacing: 6,
  },
  tagline: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "400",
    color: "#5a8fa8",
    letterSpacing: 4,
  },
});
