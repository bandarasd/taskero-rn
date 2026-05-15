import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gig } from "../../types";
import { getGigById } from "../../services/gigService";
import { ServiceSection } from "./ServiceSection";

const RECENTLY_VIEWED_KEY = "recently_viewed_gigs";

interface RecentlyViewedSectionProps {
  onGigPress: (gig: Gig) => void;
}

export function RecentlyViewedSection({ onGigPress }: RecentlyViewedSectionProps) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        // Fetch the last 5 gigs
        const fetchedGigs = await Promise.all(
          ids.slice(0, 5).map(async (id) => {
            try {
              return await getGigById(id);
            } catch {
              return null;
            }
          })
        );
        setGigs(fetchedGigs.filter((g): g is Gig => g !== null));
      }
    } catch (error) {
      console.error("Error loading recently viewed gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && gigs.length === 0) return null;

  return (
    <ServiceSection
      title="Recently Viewed"
      gigs={gigs}
      loading={loading}
      onGigPress={onGigPress}
      emptyIcon="👀"
    />
  );
}
