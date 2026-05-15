import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getGigById } from "../../services/gigService";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Region, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { BookingStepDots } from "../../components/booking/BookingStepDots";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { env } from "../../services/env";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteProps = RouteProp<BookingFlowParamList, "LocationSelection">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

const RECENT_LOCATIONS_KEY = "recent_locations";
const DEFAULT_LAT = 6.9271;
const DEFAULT_LNG = 79.8612;

export function LocationSelectionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId, notes, imageUris } = route.params;

  const [address, setAddress] = useState("");
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapView>(null);
  const userDraggedRef = useRef(false);
  const placesRef = useRef<any>(null);

  const { data: gig } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!env.googlePlacesApiKey) return;
    setReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googlePlacesApiKey}`
      );
      const json = await res.json();
      const addr: string =
        json.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(addr);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setReverseGeocoding(false);
    }
  }, []);

  const goToMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const region: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(region, 600);
      setMapRegion(region);
      void reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    } catch {}
    finally {
      setLocating(false);
    }
  }, [reverseGeocode]);

  const saveRecentLocation = async (loc: { address: string; lat: number; lng: number }) => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      const filtered = existing.filter((l: any) => l.address !== loc.address).slice(0, 2);
      await AsyncStorage.setItem(
        RECENT_LOCATIONS_KEY,
        JSON.stringify([loc, ...filtered])
      );
    } catch {}
  };

  const handleContinue = () => {
    saveRecentLocation({ address, lat: mapRegion.latitude, lng: mapRegion.longitude });
    navigation.navigate("DateTimeSelection", {
      gigId,
      taskerId: gig?.tasker_id ?? "",
      address,
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <BookingStepDots currentStep={2} />
        </View>
      </SafeAreaView>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <GooglePlacesAutocomplete
          ref={placesRef}
          placeholder="Search address..."
          onPress={async (data) => {
            const addr = data.description ?? data.structured_formatting?.main_text ?? "";
            setAddress(addr);
            if (env.googlePlacesApiKey) {
              try {
                const res = await fetch(
                  `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${env.googlePlacesApiKey}`
                );
                const json = await res.json();
                const loc = json.results?.[0]?.geometry?.location;
                if (loc) {
                  const newRegion: Region = {
                    latitude: loc.lat,
                    longitude: loc.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  };
                  setMapRegion(newRegion);
                  mapRef.current?.animateToRegion(newRegion, 600);
                }
              } catch {}
            }
          }}
          query={{ key: env.googlePlacesApiKey, language: "en" }}
          fetchDetails={false}
          enablePoweredByContainer={false}
          minLength={2}
          renderRow={(data) => (
            <View style={styles.placeRow} pointerEvents="none">
              <View style={styles.placeIconWrap}>
                <Ionicons name="location" size={18} color={colors.brandGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.placeMain} numberOfLines={1}>
                  {data.structured_formatting?.main_text ?? data.description}
                </Text>
                <Text style={styles.placeSub} numberOfLines={1}>
                  {data.structured_formatting?.secondary_text ?? ""}
                </Text>
              </View>
            </View>
          )}
          styles={{
            container: styles.placesContainer,
            textInputContainer: styles.placesInputContainer,
            textInput: styles.placesInput,
            listView: styles.placesListView,
            separator: { height: 1, backgroundColor: "#F3F4F6" },
            row: { backgroundColor: "#FFFFFF", padding: 0 },
            description: { color: colors.text },
          }}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          region={mapRegion}
          onPanDrag={() => { userDraggedRef.current = true; }}
          onRegionChangeComplete={(region) => {
            setMapRegion(region);
            if (!userDraggedRef.current) return;
            userDraggedRef.current = false;
            void reverseGeocode(region.latitude, region.longitude);
          }}
        />

        {/* Fixed centre pin */}
        <View style={styles.fixedPinWrap} pointerEvents="none">
          <Ionicons name="location" size={44} color={colors.brandGreen} style={{ marginBottom: -4 }} />
          <View style={styles.fixedPinShadow} />
        </View>

        {/* My location button */}
        <Pressable style={styles.myLocationBtn} onPress={goToMyLocation}>
          {locating ? (
            <ActivityIndicator size="small" color={colors.brandGreen} />
          ) : (
            <Ionicons name="navigate" size={22} color={colors.brandGreen} />
          )}
        </Pressable>
      </View>

      {/* Confirm bar */}
      <View style={styles.confirmBar}>
        <View style={{ flex: 1 }}>
          {reverseGeocoding ? (
            <ActivityIndicator size="small" color={colors.brandGreen} />
          ) : (
            <Text style={styles.confirmAddress} numberOfLines={2}>
              {address || "Move the map or search to pick a location"}
            </Text>
          )}
        </View>
        <Pressable
          style={[styles.confirmBtn, !address && styles.confirmBtnDisabled]}
          onPress={handleContinue}
          disabled={!address}
        >
          <Text style={styles.confirmBtnText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: { backgroundColor: colors.card, zIndex: 10 },
  headerContent: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    zIndex: 100,
  },
  placesContainer: { flex: 0 },
  placesInputContainer: { backgroundColor: "transparent", borderTopWidth: 0, borderBottomWidth: 0 },
  placesInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    fontSize: 15,
    color: colors.text,
    paddingLeft: 12,
  },
  placesListView: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 220,
  },
  placeRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  placeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  placeMain: { fontSize: 15, color: colors.text, fontWeight: "600" },
  placeSub: { fontSize: 13, color: colors.subtext },

  mapContainer: { flex: 1, position: "relative" },

  fixedPinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -40,
    marginLeft: -22,
    alignItems: "center",
    justifyContent: "center",
  },
  fixedPinShadow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: 2,
  },

  myLocationBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  confirmBar: {
    padding: spacing.lg,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  confirmAddress: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    lineHeight: 20,
  },
  confirmBtn: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmBtnDisabled: { backgroundColor: "#9CA3AF" },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
