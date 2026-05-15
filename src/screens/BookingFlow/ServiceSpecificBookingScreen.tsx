import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getGigById } from "../../services/gigService";
import { Input } from "../../components/common/Input";
import { BookingStepDots } from "../../components/booking/BookingStepDots";
import { StickyPriceCTA } from "../../components/booking/StickyPriceCTA";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { ServiceCategory } from "../../types";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteProps = RouteProp<BookingFlowParamList, "ServiceSpecific">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

type Field = { 
  key: string; 
  label: string; 
  placeholder: string; 
  helper?: string; 
  type: "text" | "number-chips" | "options-chips";
  options?: string[];
};

const CATEGORY_FIELDS: Record<ServiceCategory | string, Field[]> = {
  Cleaning: [
    { key: "home_size", label: "Home size", placeholder: "e.g. 1200", type: "options-chips", options: ["Small", "Medium", "Large"] },
    { key: "bedrooms", label: "Bedrooms", placeholder: "e.g. 3", type: "number-chips" },
    { key: "bathrooms", label: "Bathrooms", placeholder: "e.g. 2", type: "number-chips" },
    { key: "cleaning_type", label: "Cleaning type", placeholder: "e.g. Deep clean", type: "options-chips", options: ["Regular", "Deep clean"] },
  ],
  Plumbing: [
    { key: "issue_type", label: "Issue type", placeholder: "e.g. Leaking pipe", type: "text" },
    { key: "urgency", label: "Urgency", placeholder: "e.g. Urgent", type: "options-chips", options: ["Urgent", "Standard"] },
  ],
  Laundry: [
    { key: "loads", label: "Number of loads", placeholder: "e.g. 3", type: "number-chips" },
    { key: "service_type", label: "Service type", placeholder: "e.g. Wash & fold", type: "options-chips", options: ["Wash & fold", "Dry clean", "Ironing"] },
  ],
  Painting: [
    { key: "room_count", label: "Number of rooms", placeholder: "e.g. 2", type: "number-chips" },
    { key: "paint_supplied", label: "Paint supplied by", placeholder: "e.g. Me", type: "options-chips", options: ["Me", "Worker"] },
  ],
  Electrician: [
    { key: "issue", label: "Issue description", placeholder: "e.g. Outlet not working", type: "text" },
    { key: "fixture_count", label: "Number of fixtures", placeholder: "e.g. 4", type: "number-chips" },
  ],
  General: [
    { key: "description", label: "Job description", placeholder: "Describe what you need done", type: "text" },
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

  const renderField = (field: Field) => {
    switch (field.type) {
      case "number-chips":
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.chipsRow}>
              {["1", "2", "3", "4", "5+"].map((num) => {
                const isSelected = values[field.key] === num;
                return (
                  <Pressable
                    key={num}
                    style={[styles.numberChip, isSelected && styles.selectedChip]}
                    onPress={() => setValue(field.key, num)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>{num}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      case "options-chips":
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.chipsRow}>
              {field.options?.map((opt) => {
                const isSelected = values[field.key] === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.optionChip, isSelected && styles.selectedChip]}
                    onPress={() => setValue(field.key, opt)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      default:
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Input
              label={field.label}
              placeholder={field.placeholder}
              value={values[field.key] ?? ""}
              onChangeText={(val) => setValue(field.key, val)}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <BookingStepDots currentStep={4} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>{icon}</Text>
          <Text style={styles.title}>{category} details</Text>
          <Text style={styles.subtitle}>Help us prepare the best quote for you</Text>
        </View>

        <View style={styles.form}>
          {fields.map(renderField)}
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.subtext} />
          <Text style={styles.infoText}>All fields are optional but help your tasker prepare.</Text>
        </View>
      </ScrollView>

      <StickyPriceCTA
        label="Continue"
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: {
    backgroundColor: colors.card,
    zIndex: 10,
  },
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
  content: { padding: spacing.lg, paddingBottom: 120 },
  titleSection: {
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.subtext,
    marginTop: 4,
  },
  form: {
    marginBottom: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  numberChip: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    margin: spacing.xs,
    backgroundColor: colors.card,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    margin: spacing.xs,
    backgroundColor: colors.card,
  },
  selectedChip: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  selectedChipText: {
    color: "#FFFFFF",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: 13,
    color: colors.subtext,
    marginLeft: spacing.sm,
    flex: 1,
  },
});
