import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getGigById } from "../../services/gigService";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { BookingProgressBar } from "../../components/bookings/BookingProgressBar";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { ServiceCategory } from "../../types";

type RouteProps = RouteProp<BookingFlowParamList, "ServiceSpecific">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

type Field = { key: string; label: string; placeholder: string; helper?: string; keyboardType?: "numeric" | "default" };

const CATEGORY_FIELDS: Record<ServiceCategory | string, Field[]> = {
  Cleaning: [
    { key: "home_size", label: "Home Size (sq ft)", placeholder: "e.g. 1200", helper: "Approximate total floor area", keyboardType: "numeric" },
    { key: "bedrooms", label: "Bedrooms", placeholder: "e.g. 3", keyboardType: "numeric" },
    { key: "bathrooms", label: "Bathrooms", placeholder: "e.g. 2", keyboardType: "numeric" },
    { key: "cleaning_type", label: "Cleaning Type", placeholder: "e.g. Deep clean, Regular", helper: "Let us know if you need anything specific" },
  ],
  Plumbing: [
    { key: "issue_type", label: "Issue Type", placeholder: "e.g. Leaking pipe, Clogged drain" },
    { key: "urgency", label: "Urgency", placeholder: "e.g. Urgent, Next day", helper: "Urgent bookings may carry a surcharge" },
  ],
  Laundry: [
    { key: "loads", label: "Number of Loads", placeholder: "e.g. 3", keyboardType: "numeric" },
    { key: "service_type", label: "Service Type", placeholder: "e.g. Wash & fold, Pickup & dropoff" },
  ],
  Painting: [
    { key: "room_count", label: "Number of Rooms", placeholder: "e.g. 2", keyboardType: "numeric" },
    { key: "surface_area", label: "Surface Area (sq ft)", placeholder: "e.g. 400", keyboardType: "numeric" },
    { key: "paint_supplied", label: "Paint Supplied By", placeholder: "e.g. Me, You (extra cost)", helper: "Worker-supplied paint may incur an additional charge" },
  ],
  Electrician: [
    { key: "issue", label: "Issue Description", placeholder: "e.g. Outlet not working" },
    { key: "fixture_count", label: "Number of Fixtures", placeholder: "e.g. 4", keyboardType: "numeric" },
  ],
  Carpentry: [
    { key: "job_type", label: "Job Type", placeholder: "e.g. Cabinet install, Repair" },
    { key: "material", label: "Material Preference", placeholder: "e.g. Oak, MDF", helper: "Optional — worker will advise if unsure" },
  ],
  Assembly: [
    { key: "item_type", label: "Item Type", placeholder: "e.g. IKEA wardrobe, Desk" },
    { key: "item_count", label: "Number of Items", placeholder: "e.g. 2", keyboardType: "numeric" },
  ],
  Gardening: [
    { key: "garden_size", label: "Garden Size (sq ft)", placeholder: "e.g. 800", keyboardType: "numeric" },
    { key: "job_type", label: "Job Type", placeholder: "e.g. Mowing, Planting, Cleanup" },
  ],
  Moving: [
    { key: "room_count", label: "Number of Rooms", placeholder: "e.g. 3", keyboardType: "numeric" },
    { key: "distance_km", label: "Distance (km)", placeholder: "e.g. 15", keyboardType: "numeric" },
    { key: "floor_level", label: "Floor Level", placeholder: "e.g. Ground, 2nd floor", helper: "Elevator access affects pricing" },
  ],
  Repairing: [
    { key: "item_type", label: "Item Type", placeholder: "e.g. Washing machine, Door lock" },
    { key: "description", label: "Description", placeholder: "Describe the issue" },
  ],
  General: [
    { key: "description", label: "Job Description", placeholder: "Describe what you need done" },
  ],
};

const CATEGORY_ICONS: Record<string, string> = {
  Cleaning: "🧹", Plumbing: "🔧", Laundry: "👔", Painting: "🎨",
  Electrician: "⚡", Carpentry: "🪚", Assembly: "🔩", Gardening: "🌿",
  Moving: "📦", Repairing: "🛠️", General: "📋",
};

export function ServiceSpecificBookingScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId, taskerId, address, latitude, longitude, scheduledAt, category } = route.params;
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: gig } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  const fields = CATEGORY_FIELDS[category] ?? CATEGORY_FIELDS.General;
  const icon = CATEGORY_ICONS[category] ?? "📋";

  const setValue = (key: string, val: string) => setValues((prev) => ({ ...prev, [key]: val }));

  return (
    <View style={styles.container}>
      <BookingProgressBar currentStep={4} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Category header */}
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIconWrap}>
            <Text style={styles.categoryIcon}>{icon}</Text>
          </View>
          <View style={styles.categoryHeaderText}>
            <Text style={styles.title}>{category} Details</Text>
            <Text style={styles.sub}>Help the worker understand your specific needs.</Text>
          </View>
        </View>

        <View style={styles.fieldsCard}>
          {fields.map((f, idx) => (
            <View key={f.key} style={[styles.fieldWrapper, idx < fields.length - 1 && styles.fieldDivider]}>
              <Input
                label={f.label}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChangeText={(val) => setValue(f.key, val)}
                keyboardType={f.keyboardType === "numeric" ? "number-pad" : "default"}
              />
              {f.helper ? <Text style={styles.helperText}>{f.helper}</Text> : null}
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>These details help the worker provide an accurate quote. All fields are optional but improve the estimate.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue: Review & Confirm"
          onPress={() =>
            navigation.navigate("ReviewSummary", {
              gigId,
              taskerId,
              address,
              latitude,
              longitude,
              scheduledAt,
              category,
              details: values,
              basePrice: gig?.base_price ?? 0,
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 16 },

  categoryHeader: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 14 },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.brandGreenLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.brandGreen + "30",
  },
  categoryIcon: { fontSize: 26 },
  categoryHeaderText: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 2 },
  sub: { fontSize: 13, color: colors.subtext },

  fieldsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  fieldWrapper: { paddingVertical: 4 },
  fieldDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  helperText: { fontSize: 12, color: colors.placeholder, marginTop: -8, marginBottom: 8, paddingLeft: 2 },

  noteCard: {
    flexDirection: "row",
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  noteIcon: { fontSize: 15, marginTop: 1 },
  noteText: { flex: 1, fontSize: 13, color: colors.info, lineHeight: 19 },

  footer: { padding: spacing.lg, paddingBottom: 36 },
});
