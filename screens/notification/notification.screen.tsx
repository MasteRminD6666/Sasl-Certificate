import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/theme.context";
import { useLanguage } from "@/context/language.context";
import { SafeAreaView } from "react-native-safe-area-context";
import { scale, verticalScale } from "react-native-size-matters";
import { router } from "expo-router";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { fontSizes } from "@/themes/app.constant";
import AppHeader from "@/components/common/app-header";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import { NotificationsData } from "@/configs/constants";
import { Swipeable } from "react-native-gesture-handler";
import useUserData from "@/hooks/useUserData";
import { setAuthorizationHeader } from "@/hooks/fetch/useUser";
import axios from "axios";
import moment from "moment";

export default function NotificationScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { avatar } = useUserData();
  const [loader, setLoader] = useState(true);
  const [active, setActive] = useState("All");
  const [notificationsData, setNotificationsData] = useState<
    NotificationType[]
  >([]);

  useEffect(() => {
    const subscription = async () => {
      await setAuthorizationHeader();
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/get-notifications`
      );
      setNotificationsData(response.data.notifications);
      setLoader(false);
    };
    subscription();
  }, []);

  const notificationDeleteHandler = async (item: NotificationType) => {
    await setAuthorizationHeader();
    await axios
      .delete(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/delete-notification/${item.id}`
      )
      .then((res) => {
        setNotificationsData(res.data.notifications);
      });
  };

  const renderItem = ({ item }: { item: NotificationType }) => (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          style={styles.deleteButton}
          onPress={() => notificationDeleteHandler(item)}
        >
          <MaterialIcons
            name="delete-outline"
            size={scale(25)}
            color={"#fff"}
          />
        </Pressable>
      )}
    >
      <Pressable
        style={[
          styles.notificationItem,
          {
            padding: scale(14),
            paddingVertical: verticalScale(10),
            backgroundColor:
              item.status === "Unread"
                ? theme.dark
                  ? "#3c43485c"
                  : "#f1f1f1"
                : theme.dark
                ? "#101010"
                : "#fff",
          },
        ]}
      >
        {avatar && (
          <Image
            source={{ uri: item.user?.avatar }}
            width={scale(50)}
            height={scale(50)}
            borderRadius={scale(100)}
            style={{ marginRight: verticalScale(8) }}
          />
        )}
        <View style={{ width: scale(265) }}>
          <Text
            style={[
              styles.notificationText,
              {
                fontWeight: "500",
                fontFamily: "Poppins_500Medium",
                fontSize: fontSizes.FONT18,
                color: theme.dark ? "#fff" : "#000",
              },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.notificationText,
              {
                color: theme.dark ? "#fff" : "#333",
              },
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.notificationText,
              {
                opacity: 0.8,
                color: theme.dark ? "#fff" : "#333",
              },
            ]}
          >
            {moment(item.createdAt).fromNow()}
          </Text>
        </View>
      </Pressable>
    </Swipeable>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.dark ? "#101010" : "#fff" }}
    >
      <StatusBar barStyle="light-content" />
      <AppHeader title={t("notifications.title")} />

      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.dark ? "#101010" : "#fff",
          },
        ]}
      >
        {loader ? (
          <View style={{ padding: scale(16) }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i: any, index: number) => (
              <MotiView
                transition={{
                  type: "timing",
                }}
                style={{
                  flexDirection: "row",
                  gap: scale(15),
                  marginBottom: verticalScale(15),
                }}
                animate={{
                  backgroundColor: theme.dark ? "#101010" : "#ffff",
                }}
                key={index}
              >
                <Skeleton
                  colorMode={theme.dark ? "dark" : "light"}
                  radius={"round"}
                  height={scale(60)}
                  width={scale(60)}
                />
                <Skeleton
                  colorMode={theme.dark ? "dark" : "light"}
                  height={scale(50)}
                  width={scale(240)}
                />
              </MotiView>
            ))}
          </View>
        ) : (
          <>
            <View>
              <ScrollView
                horizontal={true}
                style={{ padding: scale(10) }}
                showsHorizontalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={{
                    padding: verticalScale(8),
                    backgroundColor:
                      active === "All"
                        ? "#705DF2"
                        : theme.dark
                        ? "#3c43485c"
                        : "#f5f5f5",
                    borderRadius: scale(5),
                    marginRight: scale(20),
                  }}
                  onPress={() => setActive("All")}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Poppins_500Medium",
                      fontSize: fontSizes.FONT18,
                    }}
                  >
                    {t("notifications.all")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    padding: verticalScale(8),
                    backgroundColor:
                      active === "Courses"
                        ? "#705DF2"
                        : theme.dark
                        ? "#3c43485c"
                        : "#f5f5f5",
                    borderRadius: scale(5),
                    marginRight: scale(20),
                  }}
                  onPress={() => setActive("Courses")}
                >
                  <Text
                    style={{
                      color: theme.dark ? "#fff" : "#000",
                      fontFamily: "Poppins_500Medium",
                      fontSize: fontSizes.FONT18,
                    }}
                  >
                    {t("notifications.courses")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    padding: verticalScale(8),
                    backgroundColor:
                      active === "Resources"
                        ? "#705DF2"
                        : theme.dark
                        ? "#3c43485c"
                        : "#f5f5f5",
                    borderRadius: scale(5),
                    marginRight: scale(20),
                  }}
                  onPress={() => setActive("Resources")}
                >
                  <Text
                    style={{
                      color: theme.dark ? "#fff" : "#000",
                      fontFamily: "Poppins_500Medium",
                      fontSize: fontSizes.FONT18,
                    }}
                  >
                    {t("notifications.resources")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    padding: verticalScale(8),
                    backgroundColor:
                      active === "Support Center"
                        ? "#705DF2"
                        : theme.dark
                        ? "#3c43485c"
                        : "#f5f5f5",
                    borderRadius: scale(5),
                    marginRight: scale(20),
                  }}
                  onPress={() => setActive("Support Center")}
                >
                  <Text
                    style={{
                      color: theme.dark ? "#fff" : "#000",
                      fontFamily: "Poppins_500Medium",
                      fontSize: fontSizes.FONT18,
                    }}
                  >
                    {t("notifications.supportCenter")}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <FlatList
              data={notificationsData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginTop: verticalScale(2),
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: verticalScale(8),
    marginBottom: 5,
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: verticalScale(5),
    backgroundColor: "#fff",
  },
  notificationIcon: {
    width: scale(30),
    height: scale(30),
    borderRadius: 20,
    backgroundColor: "#FFCA28",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  notificationInitial: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  notificationText: {
    flex: 1,
    color: "#333",
    fontFamily: "Poppins_400Regular",
    fontSize: fontSizes.FONT17,
  },
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: scale(50),
    height: "100%",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
