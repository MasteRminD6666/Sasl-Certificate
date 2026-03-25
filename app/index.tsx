import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Redirect } from "expo-router";
import SplashLoading from "@/components/common/splash.loading";

export default function index() {
  const [loggedInUser, setloggedInUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      // Clear mock tokens from previous testing
      if (token && token.startsWith("mock-token")) {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("name");
        await SecureStore.deleteItemAsync("email");
        await SecureStore.deleteItemAsync("avatar");
        setloggedInUser(false);
      } else {
        // Check if token exists and is valid
        setloggedInUser(token ? true : false);
      }
      setLoading(false);
    };
    subscription();
  }, []);

  return (
    <>
      {loading ? (
        <SplashLoading />
      ) : (
        <Redirect href={!loggedInUser ? "/(routes)/onboarding" : "/(tabs)"} />
      )}
    </>
  );
}
