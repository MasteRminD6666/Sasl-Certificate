import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { scale, verticalScale } from "react-native-size-matters";
import { router } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { fontSizes } from "@/themes/app.constant";
import AppHeader from "@/components/common/app-header";

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [courseUpdates, setcourseUpdates] = useState<any>("");
  const [supportTicketResponse, setsupportTicketResponse] = useState<any>("");
  const [latestUpdates, setlatestUpdates] = useState<any>("");

  useEffect(() => {
    const checkForPreferences = async () => {
      const courseUpdates = await AsyncStorage.getItem("courseUpdates");
      const supportTicketResponse = await AsyncStorage.getItem(
        "supportTicketResponse"
      );
      const latestUpdates = await AsyncStorage.getItem("latestUpdates");

      if (courseUpdates || supportTicketResponse || latestUpdates) {
        setcourseUpdates(courseUpdates === "true" ? true : false);
        setsupportTicketResponse(
          supportTicketResponse === "true" ? true : false
        );
        setlatestUpdates(latestUpdates === "true" ? true : false);
      } else {
        await AsyncStorage.setItem("courseUpdates", "true");
        await AsyncStorage.setItem("supportTicketResponse", "true");
        await AsyncStorage.setItem("latestUpdates", "true");

        setcourseUpdates(true);
        setsupportTicketResponse(true);
        setlatestUpdates(true);
      }
    };
    checkForPreferences();
  }, []);

  const updatePreferences = async (e: string) => {
    if (e === "courseUpdates") {
      setcourseUpdates(!courseUpdates);
      const value = !courseUpdates;
      await AsyncStorage.setItem("courseUpdates", value.toString());
    } else if (e === "supportTicketResponse") {
      setsupportTicketResponse(!supportTicketResponse);
      const value = !supportTicketResponse;
      await AsyncStorage.setItem("supportTicketResponse", value.toString());
    } else {
      setlatestUpdates(!latestUpdates);
      const value = !latestUpdates;
      await AsyncStorage.setItem("latestUpdates", value.toString());
    }
  };

  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: theme.dark ? "#101010" : "#fff",
      }}
    >
      <StatusBar barStyle="light-content" />
      <AppHeader title={t("settings.settings")} />

      <ScrollView style={{ padding: scale(20) }}>
        <Text
          style={[
            styles.sectionHeader,
            { color: theme.dark ? "#fff" : "#000", textAlign },
          ]}
        >
          {t("settings.pushNotifications")}
        </Text>
        <View style={[styles.settingItem, { flexDirection: rowDir }]}>
          <Text
            style={[styles.normalText, { color: theme.dark ? "#fff" : "#000", textAlign }]}
          >
            {t("settings.courseUpdates")}
          </Text>
          <Switch
            value={courseUpdates}
            onValueChange={() => updatePreferences("courseUpdates")}
          />
        </View>

        <View style={[styles.settingItem, { flexDirection: rowDir }]}>
          <Text
            style={[styles.normalText, { color: theme.dark ? "#fff" : "#000", textAlign }]}
          >
            {t("settings.supportTicketResponse")}
          </Text>
          <Switch
            value={supportTicketResponse}
            onValueChange={() => updatePreferences("supportTicketResponse")}
          />
        </View>

        <View style={[styles.settingItem, { flexDirection: rowDir }]}>
          <Text
            style={[styles.normalText, { color: theme.dark ? "#fff" : "#000", textAlign }]}
          >
            {t("settings.latestUpdates")}
          </Text>
          <Switch
            value={latestUpdates}
            onValueChange={() => updatePreferences("latestUpdates")}
          />
        </View>

        <View style={styles.settingSection}>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.dark ? "#fff" : "#000", textAlign },
            ]}
          >
            {t("settings.language")}
          </Text>
          <View style={[styles.settingItem, { flexDirection: rowDir }]}>
            <Text
              style={[
                styles.normalText,
                { color: theme.dark ? "#fff" : "#000", textAlign },
              ]}
            >
              {t("settings.selectLanguage")}
            </Text>
            <View style={{ flexDirection: rowDir, gap: scale(10) }}>
              <Pressable
                onPress={() => setLanguage("en")}
                style={{
                  paddingHorizontal: scale(15),
                  paddingVertical: verticalScale(8),
                  borderRadius: scale(8),
                  backgroundColor: language === "en" ? "#1e7bb9" : "transparent",
                  borderWidth: 1,
                  borderColor: language === "en" ? "#1e7bb9" : "#D1D5DB",
                }}
              >
                <Text
                  style={{
                    color: language === "en" ? "#fff" : (theme.dark ? "#fff" : "#000"),
                    fontSize: fontSizes.FONT16,
                    fontFamily: "Poppins_500Medium",
                  }}
                >
                  {t("settings.english")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLanguage("ar")}
                style={{
                  paddingHorizontal: scale(15),
                  paddingVertical: verticalScale(8),
                  borderRadius: scale(8),
                  backgroundColor: language === "ar" ? "#1e7bb9" : "transparent",
                  borderWidth: 1,
                  borderColor: language === "ar" ? "#1e7bb9" : "#D1D5DB",
                }}
              >
                <Text
                  style={{
                    color: language === "ar" ? "#fff" : (theme.dark ? "#fff" : "#000"),
                    fontSize: fontSizes.FONT16,
                    fontFamily: "Poppins_500Medium",
                  }}
                >
                  {t("settings.arabic")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.settingSection}>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.dark ? "#fff" : "#000", textAlign },
            ]}
          >
            {t("settings.theme")}
          </Text>
          <View style={[styles.settingItem, { flexDirection: rowDir }]}>
            <Text
              style={[
                styles.normalText,
                { color: theme.dark ? "#fff" : "#000", textAlign },
              ]}
            >
              {theme.dark ? t("settings.darkMode") : t("settings.lightMode")}
            </Text>
            <Switch value={theme.dark} onValueChange={toggleTheme} />
          </View>
        </View>
        {/* Developer Tools */}
        <View style={styles.settingSection}>
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.dark ? "#fff" : "#000", textAlign },
            ]}
          >
            Developer Tools
          </Text>
          <Pressable
            onPress={() => router.push("/(routes)/network-logger")}
            style={[
              styles.settingItem,
              {
                flexDirection: rowDir,
                backgroundColor: theme.dark ? "#1a1a2e" : "#f0f4ff",
                padding: scale(12),
                borderRadius: scale(8),
              },
            ]}
          >
            <Text
              style={[
                styles.normalText,
                { color: theme.dark ? "#fff" : "#000", textAlign },
              ]}
            >
              Network Logger
            </Text>
            <AntDesign
              name={isRTL ? "left" : "right"}
              size={scale(18)}
              color={theme.dark ? "#fff" : "#005DE0"}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  settingSection: {
    marginBottom: verticalScale(30),
  },
  sectionHeader: {
    fontSize: fontSizes.FONT23,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: verticalScale(10),
  },
  settingItem: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(15),
  },
  normalText: {
    fontSize: fontSizes.FONT19,
    opacity: 0.9,
    fontFamily: "Poppins_500Medium",
  },
});
