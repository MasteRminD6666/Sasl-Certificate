import { useEffect, useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const SASL_BASE = "https://sasl.sba.gov.sa";

export interface Booking {  
  id: number;
  service_id: number;
  status: { id: number; name?: string };
  progress: number;
  modules: { amount: number };
  title?: string;
  event_pic_url?: string;
  canonical_url?: string;
  created_at?: string;
  updated_at?: string;
  // We'll merge extra course info from the service object if present
  service?: {
    id: number;
    title?: string;
    event_pic_url?: string;
    _links?: { canonical?: { href?: string } };
  };
}

const useGetBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("accessToken");
      const userId = await SecureStore.getItemAsync("userId");

      if (!token || !userId) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${SASL_BASE}/api/v3/users/${userId}/bookings?remove_approval_flag=true`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": "ar",
          },
        }
      );

      const data = response.data?.data || response.data || [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {

      setError(err?.response?.data?.message || err.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Re-fetch when the screen is focused
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchBookings();
    });
    return unsubscribe;
  }, [navigation, fetchBookings]);

  return { bookings, loading, error, refetch: fetchBookings };
};

export default useGetBookings;
