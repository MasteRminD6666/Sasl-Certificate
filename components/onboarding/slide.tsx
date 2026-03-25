import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  Modal,
  Image,
  ImageBackground,
} from "react-native";
import React, { useState } from "react";
import { useLanguage } from "@/context/language.context";
import { HEIGHT, WIDTH } from "@/configs/constants";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import {
  fontSizes,
  SCREEN_WIDTH,
  windowHeight,
  windowWidth,
} from "@/themes/app.constant";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AuthModal from "../auth/auth.modal";

export default function Slide({
  slide,
  index,
  setIndex,
  totalSlides,
}: {
  slide: onBoardingSlidesTypes;
  index: number;
  setIndex: (value: number) => void;
  totalSlides: number;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useLanguage();

  const handlePress = (index: number, setIndex: (index: number) => void) => {
    if (index === 2) {
      setModalVisible(true);
    } else {
      setIndex(index + 1);
    }
  };

  const gradientColors: [string, string, string] =
    slide.color === "#1e7bb9"
      ? ["#e8f4f8", "#d0e9f1", "#b8def0"]
      : slide.color === "#0f64a7"
      ? ["#d0e9f1", "#b8def0", "#a0d3ef"]
      : ["#e0f5f2", "#c8ebe6", "#b0e1da"];

  return (
    <>
      {/* Gradient base */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Background image overlay */}
      {slide.backgroundImage && (
        <Image
          source={{ uri: slide.backgroundImage }}
          style={{
            position: "absolute",
            width: WIDTH,
            height: HEIGHT,
            opacity: 0.12,
            resizeMode: "cover",
          }}
        />
      )}
      <View style={styles.container}>
        {/* Image area - centered in upper portion */}
        <View style={styles.imageContainer}>
          {slide.image}
        </View>

        {/* Text area - positioned below image */}
        <View style={styles.textContainer}>
          <Text
            style={{
              fontSize: fontSizes.FONT28,
              fontWeight: "600",
              color: "#05030D",
              fontFamily: "Poppins_600SemiBold",
              lineHeight: fontSizes.FONT28 * 1.2,
            }}
          >
            {slide.title}
          </Text>
          <Text
            style={{
              fontSize: fontSizes.FONT28,
              fontWeight: "600",
              color: "#1e7bb9",
              fontFamily: "Poppins_600SemiBold",
              lineHeight: fontSizes.FONT28 * 1.2,
            }}
          >
            {slide.secondTitle}
          </Text>
          <Text
            style={{
              marginTop: verticalScale(8),
              fontSize: fontSizes.FONT15,
              color: "#3E3B54",
              fontFamily: "Poppins_300Light",
              lineHeight: fontSizes.FONT15 * 1.6,
            }}
          >
            {slide.subTitle}
          </Text>
        </View>
      </View>
      {!modalVisible && (
        <>
          <View style={styles.indicatorContainer}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.indicator, i === index && styles.activeIndicator]}
              />
            ))}
          </View>
          {/* Next Button */}
          {index <= totalSlides - 1 && (
            <LinearGradient
              colors={["#1e7bb9", "#0f64a7"]}
              style={styles.nextButton}
            >
              <Pressable
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                }}
                onPress={() => handlePress(index, setIndex)}
              >
                <Text style={styles.nextButtonText}>{t("common.next")}</Text>
              </Pressable>
            </LinearGradient>
          )}
          {index < totalSlides - 1 && (
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => handlePress(index, setIndex)}
            >
              <Ionicons
                name="chevron-forward-outline"
                size={scale(18)}
                color="black"
              />
            </TouchableOpacity>
          )}
        </>
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)}>
          <AuthModal setModalVisible={setModalVisible} />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: scale(30),
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 0,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(24),
    marginTop: verticalScale(-40),
  },
  textContainer: {
    width: "100%",
    paddingHorizontal: scale(10),
    marginBottom: verticalScale(60),
  },
  indicatorContainer: {
    flexDirection: "row",
    marginTop: verticalScale(35),
    position: "absolute",
    bottom: verticalScale(55),
    left: scale(22),
  },
  indicator: {
    height: verticalScale(7),
    width: scale(18),
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: scale(4),
    borderRadius: scale(4),
  },
  activeIndicator: {
    height: verticalScale(7),
    width: scale(35),
    backgroundColor: "white",
  },
  nextButton: {
    position: "absolute",
    zIndex: 999999999,
    right: windowWidth(25),
    bottom: windowHeight(50),
    marginTop: windowHeight(30),
    alignItems: "center",
    justifyContent: "center",
    width: windowWidth(140),
    height: windowHeight(37),
    borderRadius: windowWidth(20),
  },
  nextButtonText: {
    color: "white",
    fontSize: fontSizes.FONT22,
    fontWeight: "bold",
  },
  arrowButton: {
    position: "absolute",
    width: scale(30),
    height: scale(30),
    borderRadius: scale(20),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    right: moderateScale(5),
    top: Platform.OS === "ios" ? verticalScale(345) : verticalScale(385),
    transform: [{ translateY: -30 }],
  },
});
