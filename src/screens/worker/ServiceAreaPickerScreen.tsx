import React, { useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";
import { colors } from "../../theme/colors";
import { serviceAreaResult } from "../../utils/serviceAreaResult";

type Props = NativeStackScreenProps<WorkerStackParamList, "ServiceAreaPicker">;

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 100;

export function ServiceAreaPickerScreen({ route, navigation }: Props) {
  const { gigId, initialLat, initialLng, initialRadius } = route.params ?? {};

  const [latitude, setLatitude] = useState(initialLat ?? 6.9271);
  const [longitude, setLongitude] = useState(initialLng ?? 79.8612);
  const [radiusKm, setRadiusKm] = useState(initialRadius ?? 10);
  const mapRef = useRef<MapView>(null);

  // Slider track width measured via onLayout
  const trackWidthRef = useRef(1);

  useEffect(() => {
    if (initialLat && initialLng) return; // already have a position, no need to locate
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const moveMap = (lat: number, lng: number) => {
        setLatitude(lat);
        setLongitude(lng);
        mapRef.current?.animateToRegion(
          { latitude: lat, longitude: lng, latitudeDelta: (radiusKm / 111) * 3, longitudeDelta: (radiusKm / 111) * 3 },
          600
        );
      };

      // Fast path: use the cached last-known position (instant)
      const cached = await Location.getLastKnownPositionAsync();
      if (cached) {
        moveMap(cached.coords.latitude, cached.coords.longitude);
        return; // good enough — don't wait for a fresh fix
      }

      // Slow path: request a fresh GPS fix only when there's no cache
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      moveMap(loc.coords.latitude, loc.coords.longitude);
    })();
  }, []);

  const handleRegionChangeComplete = (region: Region) => {
    setLatitude(region.latitude);
    setLongitude(region.longitude);
  };

  const adjustRadius = (delta: number) => {
    setRadiusKm((prev) =>
      Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, prev + delta))
    );
  };

  // Draggable slider handlers
  const handleTrackLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  const computeRadiusFromTouchX = (touchX: number) => {
    const pct = Math.min(1, Math.max(0, touchX / trackWidthRef.current));
    return Math.round(MIN_RADIUS_KM + pct * (MAX_RADIUS_KM - MIN_RADIUS_KM));
  };

  const handleConfirm = () => {
    serviceAreaResult.set({ latitude, longitude, radius_km: radiusKm });
    navigation.goBack();
  };

  const fillPercent =
    ((radiusKm - MIN_RADIUS_KM) / (MAX_RADIUS_KM - MIN_RADIUS_KM)) * 100;
  const thumbLeft = `${fillPercent}%` as any;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: (radiusKm / 111) * 3,
          longitudeDelta: (radiusKm / 111) * 3,
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
      >
        {/* Circle updates as map center changes */}
        <Circle
          center={{ latitude, longitude }}
          radius={radiusKm * 1000}
          fillColor="rgba(0,191,99,0.12)"
          strokeColor={colors.brandGreen}
          strokeWidth={2}
        />
      </MapView>

      {/* Fixed center pin — absoluteFill + flexbox so the icon tip lands exactly at center */}
      <View pointerEvents="none" style={styles.pinOverlay}>
        {/* translateY: -22 lifts the icon by half its height so the TIP (bottom) is at center */}
        <View style={styles.pinWrapper}>
          <Ionicons name="location-sharp" size={44} color={colors.brandGreen} />
          <View style={styles.pinShadow} />
        </View>
      </View>

      {/* Bottom control panel */}
      <View style={styles.controls}>
        <Text style={styles.radiusLabel}>
          Service radius: <Text style={styles.radiusValue}>{radiusKm} km</Text>
        </Text>

        {/* Draggable slider */}
        <View style={styles.sliderRow}>
          <Pressable style={styles.adjBtn} onPress={() => adjustRadius(-1)}>
            <Text style={styles.adjBtnText}>−</Text>
          </Pressable>

          <View
            style={styles.trackWrapper}
            onLayout={handleTrackLayout}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              const x = e.nativeEvent.locationX;
              setRadiusKm(computeRadiusFromTouchX(x));
            }}
            onResponderMove={(e) => {
              const x = e.nativeEvent.locationX;
              setRadiusKm(computeRadiusFromTouchX(x));
            }}
          >
            {/* Track background */}
            <View style={styles.trackBg} />
            {/* Filled portion */}
            <View style={[styles.trackFill, { width: `${fillPercent}%` }]} />
            {/* Thumb */}
            <View style={[styles.thumb, { left: thumbLeft }]} />
          </View>

          <Pressable style={styles.adjBtn} onPress={() => adjustRadius(1)}>
            <Text style={styles.adjBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>Drag the map to move the center • drag slider to adjust radius</Text>

        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Service Area</Text>
        </Pressable>
      </View>
    </View>
  );
}

const THUMB_SIZE = 22;
const PIN_SIZE = 44;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // Pin overlay: covers the map, centers the pin via flexbox
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    // Disable touch so map panning works through this layer
  },
  pinWrapper: {
    alignItems: "center",
    // Shift icon up so its TIP (bottom edge) sits at the flex center point
    // Icon height = PIN_SIZE = 44; shift up by PIN_SIZE/2 = 22
    transform: [{ translateY: -(PIN_SIZE / 2) }],
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.20)",
    marginTop: -1,
  },

  // Controls panel
  controls: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    gap: 14,
  },
  radiusLabel: { fontSize: 15, fontWeight: "600", color: colors.subtext, textAlign: "center" },
  radiusValue: { color: colors.brandGreen, fontSize: 18, fontWeight: "800" },

  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  adjBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandGreenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  adjBtnText: { fontSize: 22, fontWeight: "700", color: colors.brandGreen, lineHeight: 26 },

  // Slider track area — tall hit zone for easy touch
  trackWrapper: {
    flex: 1,
    height: 36,
    justifyContent: "center",
    position: "relative",
  },
  trackBg: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  trackFill: {
    position: "absolute",
    left: 0,
    height: 6,
    backgroundColor: colors.brandGreen,
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#fff",
    borderWidth: 2.5,
    borderColor: colors.brandGreen,
    marginLeft: -(THUMB_SIZE / 2),
    top: (36 - THUMB_SIZE) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  hint: { fontSize: 11, color: colors.subtext, textAlign: "center" },
  confirmBtn: {
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
