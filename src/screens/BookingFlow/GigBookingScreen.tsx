import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getGigById } from "../../services/gigService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { StarRating } from "../../components/gigs/StarRating";
import { Avatar } from "../../components/common/Avatar";
import { BookingProgressBar } from "../../components/bookings/BookingProgressBar";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";

type RouteProps = RouteProp<BookingFlowParamList, "GigBooking">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

const MAX_NOTES = 300;

export function GigBookingScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId } = route.params;
  const [notes, setNotes] = useState("");

  const { data: gig, isLoading } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  if (isLoading || !gig) return <LoadingSpinner />;

  const workerName = gig.tasker
    ? `${gig.tasker.first_name ?? ""} ${gig.tasker.last_name ?? ""}`.trim()
    : "Worker";

  return (
    <View style={styles.container}>
      <BookingProgressBar currentStep={1} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Service card */}
        <View style={styles.gigCard}>
          <View style={styles.workerRow}>
            <View style={styles.avatarRing}>
              <Avatar uri={gig.tasker?.avatar_url} name={workerName} size={52} />
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.gigTitle} numberOfLines={2}>{gig.title}</Text>
              <Text style={styles.workerName}>{workerName}</Text>
              <StarRating value={gig.rating ?? 0} size={13} style={{ marginTop: 4 }} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.price}>${gig.base_price}<Text style={styles.priceUnit}>/hr</Text></Text>
            </View>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{gig.category ?? "Service"}</Text>
            </View>
          </View>
        </View>

        {/* Notes section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Any special instructions?</Text>
          <Text style={styles.sectionSub}>Help the worker prepare before they arrive.</Text>

          <Input
            label="Notes for the worker (optional)"
            value={notes}
            onChangeText={(t) => setNotes(t.slice(0, MAX_NOTES))}
            placeholder="e.g. Use the back entrance, dog is friendly, gate code is 1234..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
          <Text style={styles.charCount}>{notes.length}/{MAX_NOTES}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue: Select Location"
          onPress={() => navigation.navigate("LocationSelection", { gigId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 16 },

  gigCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  workerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  avatarRing: {
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.brandGreen,
    padding: 2,
    marginRight: 14,
  },
  workerInfo: { flex: 1 },
  gigTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2, lineHeight: 22 },
  workerName: { fontSize: 13, color: colors.subtext, marginBottom: 2 },

  divider: { height: 1, backgroundColor: colors.borderLight, marginBottom: 14 },

  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  priceLabel: { fontSize: 11, color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  price: { fontSize: 26, fontWeight: "800", color: colors.brandGreen },
  priceUnit: { fontSize: 14, fontWeight: "500", color: colors.subtext },
  categoryPill: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.brandGreen + "40",
  },
  categoryPillText: { fontSize: 12, fontWeight: "600", color: colors.brandGreenDark },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: colors.subtext, marginBottom: 16 },
  notesInput: { height: 110, textAlignVertical: "top", paddingTop: 12 },
  charCount: { fontSize: 11, color: colors.placeholder, textAlign: "right", marginTop: 4 },

  footer: { padding: spacing.lg, paddingBottom: 36 },
});
