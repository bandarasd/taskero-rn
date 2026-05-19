import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { env } from "../services/env";

const DEFAULT_REGION: Region = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (address: string) => void;
};

export function LocationSelectionModal({ visible, onClose, onConfirm }: Props) {
  const mapRef = useRef<MapView>(null);
  const placesRef = useRef<any>(null);
  const userDraggedRef = useRef(false);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [pendingAddress, setPendingAddress] = useState("");
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!env.googlePlacesApiKey) return;
    setReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googlePlacesApiKey}`
      );
      const json = await res.json();
      const address: string =
        json.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setPendingAddress(address);
    } catch {
      setPendingAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={() => {
        userDraggedRef.current = false;
        setPendingAddress("");
      }}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <KeyboardAvoidingView
          style={styles.modalSheet}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Pressable style={styles.sheetCloseBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#374151" />
              </Pressable>
              <Text style={styles.sheetTitle}>Set Location</Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.mapSearchWrap}>
              <GooglePlacesAutocomplete
                ref={placesRef}
                placeholder="Search for an address"
                onPress={async (data) => {
                  const address =
                    data.description ?? data.structured_formatting?.main_text ?? "";
                  setPendingAddress(address);
                  if (env.googlePlacesApiKey) {
                    try {
                      const res = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${env.googlePlacesApiKey}`
                      );
                      const json = await res.json();
                      const loc = json.results?.[0]?.geometry?.location;
                      if (loc) {
                        const newRegion = {
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
                listLoaderComponent={
                  <View style={styles.placesLoader}>
                    <ActivityIndicator size="small" color={colors.brandGreen} />
                  </View>
                }
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
                  separator: styles.placesSeparator,
                  row: { backgroundColor: "#FFFFFF", padding: 0 },
                  description: { color: "#111111" },
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                region={mapRegion}
                onPanDrag={() => {
                  userDraggedRef.current = true;
                }}
                onRegionChangeComplete={(region) => {
                  setMapRegion(region);
                  if (!userDraggedRef.current) return;
                  userDraggedRef.current = false;
                  void reverseGeocode(region.latitude, region.longitude);
                }}
              />
              <View style={styles.fixedPinWrap} pointerEvents="none">
                <Ionicons
                  name="location"
                  size={44}
                  color={colors.brandGreen}
                  style={{ marginBottom: -4 }}
                />
                <View style={styles.fixedPinShadow} />
              </View>
              <Pressable style={styles.myLocationBtn} onPress={goToMyLocation}>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.brandGreen} />
                ) : (
                  <Ionicons name="navigate" size={22} color={colors.brandGreen} />
                )}
              </Pressable>
            </View>

            <View style={styles.mapConfirmBar}>
              <View style={{ flex: 1 }}>
                {reverseGeocoding ? (
                  <ActivityIndicator size="small" color={colors.brandGreen} />
                ) : (
                  <Text style={styles.mapConfirmAddress} numberOfLines={2}>
                    {pendingAddress || "Move the map to pick a location"}
                  </Text>
                )}
              </View>
              <Pressable
                style={[styles.mapConfirmBtn, !pendingAddress && styles.mapConfirmBtnDisabled]}
                onPress={() => pendingAddress && onConfirm(pendingAddress)}
              >
                <Text style={styles.mapConfirmBtnText}>Confirm</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    height: "85%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  mapSearchWrap: { zIndex: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  placesContainer: { flex: 0 },
  placesInputContainer: { backgroundColor: "transparent" },
  placesInput: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111827",
  },
  placesListView: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginTop: 4,
    maxHeight: 200,
  },
  placesSeparator: { height: 1, backgroundColor: "#F3F4F6" },
  placesLoader: { padding: 12, alignItems: "center" },
  placeRow: { flexDirection: "row", alignItems: "center", padding: 12 },
  placeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  placeMain: { fontSize: 14, fontWeight: "600", color: "#111827" },
  placeSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  fixedPinWrap: { position: "absolute", top: "50%", left: "50%", marginLeft: -22, marginTop: -44, alignItems: "center" },
  fixedPinShadow: { width: 8, height: 4, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.2)" },
  myLocationBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  mapConfirmBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  mapConfirmAddress: { fontSize: 13, color: "#374151", lineHeight: 18 },
  mapConfirmBtn: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  mapConfirmBtnDisabled: { opacity: 0.4 },
  mapConfirmBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
