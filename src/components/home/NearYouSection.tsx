import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Gig } from "../../types";
import { getGigs } from "../../services/gigService";
import { ServiceSection } from "./ServiceSection";

interface NearYouSectionProps {
  onGigPress: (gig: Gig) => void;
}

export function NearYouSection({ onGigPress }: NearYouSectionProps) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    loadNearYou();
  }, []);

  const loadNearYou = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasLocation(false);
        setLoading(false);
        return;
      }

      setHasLocation(true);
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const res = await getGigs(1, 15);
      const allGigs = res.data;

      const filtered = allGigs.filter(gig => {
        if (!gig.service_area) return true;
        const dist = Math.sqrt(
          Math.pow(gig.service_area.latitude - location.coords.latitude, 2) +
          Math.pow(gig.service_area.longitude - location.coords.longitude, 2)
        );
        return dist < 0.1;
      });

      setGigs(filtered.length > 0 ? filtered : allGigs.slice(2, 6));
    } catch (error) {
      console.error("Error loading near you gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && !hasLocation) return null;

  return (
    <ServiceSection
      title="Near You"
      gigs={gigs}
      loading={loading}
      onGigPress={onGigPress}
      emptyIcon="📍"
    />
  );
}
