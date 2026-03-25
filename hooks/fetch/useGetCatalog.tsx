import { useEffect, useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const SASL_BASE = "https://sasl.sba.gov.sa";

const TAG_IDS = [56, 57, 58, 59, 7, 8, 9, 10];

export interface CatalogCourse {
  id: number;
  title: string;
  event_pic_url?: string;
  canonical_url?: string;
  _links?: { canonical?: { href?: string } };
  tags?: { id: number; name?: string }[];
  tag_id?: number;
  modules_count?: number;
  price?: number;
  original_price?: number;
  description?: string;
  status?: string;
  progress?: number;
}

export interface TagCategory {
  id: number;
  name: string;
  count: number;
}

const useGetCatalog = () => {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("accessToken");
      const userId = await SecureStore.getItemAsync("userId");

      const headers: any = {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Accept-Language": "ar",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Fetch courses from all tags + user bookings in parallel
      const bookingsPromise =
        token && userId
          ? axios
              .get(
                `${SASL_BASE}/api/v3/users/${userId}/bookings?remove_approval_flag=true`,
                { headers }
              )
              .catch(() => null)
          : Promise.resolve(null);

      const [coursesResponses, bookingsRes] = await Promise.all([
        Promise.allSettled(
          TAG_IDS.map((tagId) =>
            axios.get(`${SASL_BASE}/api/v3/services?tag_id=${tagId}`, { headers })
          )
        ),
        bookingsPromise,
      ]);

      // Build bookings lookup: service_id -> { modules.amount, progress, status }
      const bookingsMap = new Map<
        number,
        { modulesAmount: number; progress: number; status: string }
      >();
      if (bookingsRes) {
        const bData = bookingsRes.data?.data || bookingsRes.data || [];
        const bItems: any[] = Array.isArray(bData) ? bData : [];
        bItems.forEach((b: any) => {
          if (b.service_id) {
            bookingsMap.set(b.service_id, {
              modulesAmount: b.modules?.amount || 0,
              progress: b.progress || 0,
              status: b.status?.name || "",
            });
          }
        });
      }

      const allCourses: CatalogCourse[] = [];
      const seenIds = new Set<number>();
      const tagCounts: Record<number, { name: string; count: number }> = {};

      coursesResponses.forEach((res, index) => {
        if (res.status === "fulfilled") {
          const data = res.value.data?.data || res.value.data || [];
          const items = Array.isArray(data) ? data : [];
          const tagId = TAG_IDS[index];

          items.forEach((course: any) => {
            if (!seenIds.has(course.id)) {
              seenIds.add(course.id);

              const booking = bookingsMap.get(course.id);

              allCourses.push({
                ...course,
                tag_id: tagId,
                modules_count: booking?.modulesAmount || course.modules_count || course.modules?.amount || 0,
                progress: booking?.progress,
                status: booking?.status,
              });
            }

            if (course.tags && Array.isArray(course.tags)) {
              course.tags.forEach((tag: any) => {
                if (tag.id && tag.name) {
                  if (!tagCounts[tag.id]) {
                    tagCounts[tag.id] = { name: tag.name, count: 0 };
                  }
                  tagCounts[tag.id].count++;
                }
              });
            }
          });
        }
      });

      setCourses(allCourses);

      const cats = Object.entries(tagCounts)
        .map(([id, { name, count }]) => ({
          id: Number(id),
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      setCategories(cats);
    } catch (err: any) {
      setError(err.message || "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (courses.length === 0) fetchCatalog();
    });
    return unsubscribe;
  }, [navigation, fetchCatalog, courses.length]);

  return { courses, categories, loading, error, refetch: fetchCatalog };
};

export default useGetCatalog;
