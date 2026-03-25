import { StyleSheet, Text, View, Platform } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

// Lazy load MaskedView only when needed and in native environment
const getMaskedView = (): any => {
  // Skip in web environments
  if (Platform.OS === "web") return null;
  
  // Skip in Node.js environment (static rendering)
  // Check if we're in Node.js by checking for process.versions.node
  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    // We're in Node.js (static rendering), not a native React Native environment
    return null;
  }
  
  try {
    // Verify requireNativeComponent exists before requiring masked-view
    // This ensures we're in a native environment, not Node.js/static rendering
    const RN = require("react-native");
    if (!RN || typeof RN.requireNativeComponent !== "function") {
      // In Node.js/static rendering, requireNativeComponent won't exist
      return null;
    }
    // Only require in native environments where requireNativeComponent exists
    const maskedViewModule = require("@react-native-community/masked-view");
    return maskedViewModule?.default || maskedViewModule;
  } catch (e) {
    // MaskedView not available or error during require
    return null;
  }
};

export default function GradiantText({
  text,
  styles,
}: {
  text: string;
  styles: any;
}) {
  // Lazy load MaskedView only when needed
  const MaskedViewComponent = getMaskedView();
  
  // Web/static rendering fallback - just show gradient text without masking
  if (Platform.OS === "web" || !MaskedViewComponent) {
    return (
      <LinearGradient
        colors={["#1e7bb9", "#0f64a7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles}>{text}</Text>
      </LinearGradient>
    );
  }

  return (
    // @ts-ignore
    <MaskedViewComponent
      maskElement={
        <Text style={[styles, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient
        colors={["#1e7bb9", "#0f64a7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedViewComponent>
  );
}

const styles = StyleSheet.create({});
