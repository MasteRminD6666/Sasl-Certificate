import { useEffect, useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

export default function useUserData() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  const loadUserSession = useCallback(async () => {
    try {
      const storedName = SecureStore.getItem("name");
      const storedEmail = SecureStore.getItem("email");
      const storedAvatar = SecureStore.getItem("avatar");
      setName(storedName || "");
      setEmail(storedEmail || "");
      setAvatar(storedAvatar || "");
    } catch (e) {
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadUserSession();
  }, [loadUserSession]);

  // Reload when the screen comes back into focus
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserSession();
    });
    return unsubscribe;
  }, [navigation, loadUserSession]);

  return { name, email, avatar };
}
