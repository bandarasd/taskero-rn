import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getGigById } from "../../services/gigService";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Button } from "../../components/common/Button";
import { BookingProgressBar } from "../../components/bookings/BookingProgressBar";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { env } from "../../services/env";
import type { BookingFlowParamList } from "./BookingFlowNavigator";

type RouteProps = RouteProp<BookingFlowParamList, "LocationSelection">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

export function LocationSelectionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId } = route.params;
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();

  const { data: gig } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  const canContinue = address.length > 0;

  return (
    <View style={styles.container}>
      <BookingProgressBar currentStep={2} />

      <View style={styles.content}>
        <Text style={styles.title}>Where do you need service?</Text>
        <Text style={styles.sub}>Enter the address where the work should be done.</Text>

        <GooglePlacesAutocomplete
          placeholder="🔍  Search address..."
          onPress={(data, details) => {
            setAddress(data.description);
            if (details?.geometry?.location) {
              setLat(details.geometry.location.lat);
              setLng(details.geometry.location.lng);
            }
          }}
          query={{
            key: env.googlePlacesApiKey,
            language: "en",
          }}
          fetchDetails
          styles={{
            textInput: styles.searchInput,
            container: styles.autocompleteContainer,
            listView: styles.listView,
          }}
        />

        {address ? (
          <View style={styles.confirmedCard}>
            <View style={styles.confirmedIconWrap}>
              <Text style={styles.confirmedIcon}>📍</Text>
            </View>
            <View style={styles.confirmedText}>
              <Text style={styles.confirmedLabel}>Service address</Text>
              <Text style={styles.confirmedAddress}>{address}</Text>
            </View>
            <Text style={styles.confirmedCheck}>✓</Text>
          </View>
        ) : null}

        <View style={styles.hintCard}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>Make sure the address is accessible on the day of service. You can add gate codes or instructions in the notes.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label="Continue: Choose Date & Time"
          onPress={() =>
            navigation.navigate("DateTimeSelection", {
              gigId,
              taskerId: gig?.tasker_id ?? "",
              address,
              latitude: lat,
              longitude: lng,
            })
          }
          disabled={!canContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 6 },
  sub: { fontSize: 14, color: colors.subtext, marginBottom: 20, lineHeight: 20 },

  autocompleteContainer: { zIndex: 999, marginBottom: 16 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: 15,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    color: colors.text,
    height: 48,
  },
  listView: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    marginTop: 4,
  },
  listRow: { paddingVertical: 12, paddingHorizontal: 14 },
  listDescription: { fontSize: 14, color: colors.text },

  confirmedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  confirmedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandGreen + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedIcon: { fontSize: 18 },
  confirmedText: { flex: 1 },
  confirmedLabel: { fontSize: 11, fontWeight: "600", color: colors.brandGreenDark, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  confirmedAddress: { fontSize: 14, color: colors.text, lineHeight: 20 },
  confirmedCheck: { fontSize: 18, color: colors.brandGreen, fontWeight: "700" },

  hintCard: {
    flexDirection: "row",
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  hintIcon: { fontSize: 16, marginTop: 1 },
  hintText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19 },

  footer: { padding: spacing.lg, paddingBottom: 36 },
});
