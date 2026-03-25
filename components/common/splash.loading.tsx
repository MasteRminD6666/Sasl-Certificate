import React from "react";
import { View, StyleSheet, Image, Dimensions, ActivityIndicator } from "react-native";

const { width } = Dimensions.get("window");

export default function SplashLoading() {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/icon.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <ActivityIndicator
        size="large"
        color="#1e7bb9"
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width * 0.4,
    height: width * 0.4,
  },
  loader: {
    marginTop: 30,
  },
});
