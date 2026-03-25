import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import NetworkLogger from "react-native-network-logger";
import { router } from "expo-router";

export default function NetworkLoggerScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{"← Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Network Logger</Text>
        <View style={styles.placeholder} />
      </View>
      <NetworkLogger />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#1a1a2e",
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 50,
  },
});
