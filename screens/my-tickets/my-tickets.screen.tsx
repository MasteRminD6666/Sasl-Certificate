import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { useTheme } from "@/context/theme.context";
import { scale, verticalScale } from "react-native-size-matters";
import IconSix from "@/assets/svgs/support-center/six";
import { fontSizes } from "@/themes/app.constant";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import useUser from "@/hooks/fetch/useUser";
import AppHeader from "@/components/common/app-header";

export default function MyTicketsScreen() {
  const { theme } = useTheme();
  const { user } = useUser();

  return (
    <View style={{ flex: 1, backgroundColor: theme.dark ? "#101010" : "#fff" }}>
      <AppHeader title="My Tickets" />

      <ScrollView style={{ padding: scale(15) }}>
        {user?.Tickets.slice()
          .reverse()
          .map((item: TicketsTypes, index: number) => (
            <Pressable
              style={{
                backgroundColor: theme.dark ? "#3c43485c" : "#eaf3fb85",
                borderRadius: scale(10),
                shadowOpacity: 0.1,
                shadowColor: "#40E0D0",
                shadowRadius: 5,
                padding: scale(10),
                marginTop: verticalScale(20),
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              key={index}
              onPress={() =>
                router.push({
                  pathname: "/(routes)/support-chat",
                  params: { ticket: JSON.stringify(item) },
                })
              }
            >
              <Text
                style={{
                  color: !theme.dark ? "#000" : "#fff",
                  fontSize: fontSizes.FONT22,
                  fontFamily: "Poppins_500Medium",
                  width: scale(220),
                }}
              >
                {item.ticketTitle}
              </Text>
              <Text
                style={{
                  color:
                    item.status !== "Pending"
                      ? "#19C964"
                      : theme.dark
                      ? "#fff"
                      : "#000",
                  fontSize: fontSizes.FONT22,
                  opacity: item?.status === "Pending" ? 0.7 : 1,
                  fontFamily: "Poppins_500Medium",
                }}
              >
                {item.status}
              </Text>
            </Pressable>
          ))}
      </ScrollView>
    </View>
  );
}
