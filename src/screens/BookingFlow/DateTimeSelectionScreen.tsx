import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "../../services/scheduleService";
import { getGigById } from "../../services/gigService";
import { BookingStepDots } from "../../components/booking/BookingStepDots";
import { StickyPriceCTA } from "../../components/booking/StickyPriceCTA";
import { DateChip } from "../../components/booking/DateChip";
import { SkeletonCard } from "../../components/booking/SkeletonCard";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, addDays } from "date-fns";
import type { TimePreference, VisitTier } from "../../types";

type RouteProps = RouteProp<BookingFlowParamList, "DateTimeSelection">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

function isoDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

const TIME_PREFS: { key: TimePreference; label: string; sub: string; icon: string }[] = [
  { key: "morning",   label: "Morning",   sub: "8 AM – 12 PM",  icon: "sunny-outline" },
  { key: "afternoon", label: "Afternoon", sub: "12 PM – 5 PM",  icon: "partly-sunny-outline" },
  { key: "evening",   label: "Evening",   sub: "5 PM – 8 PM",   icon: "moon-outline" },
];

export function DateTimeSelectionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId, taskerId, address, latitude, longitude } = route.params;

  const today = new Date();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPref, setSelectedPref] = useState<TimePreference | null>(null);
  const [selectedTier, setSelectedTier] = useState<VisitTier | null>(null);

  const { data: gig } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  const tiers: VisitTier[] = gig?.visit_tiers?.length
    ? gig.visit_tiers
    : [{ label: "Standard", days: 7, surcharge_type: "percent", surcharge_value: 0 }];

  const basePrice = Number(gig?.base_price ?? 0);
  const activeTier = selectedTier ?? (tiers.find(t => t.surcharge_value === 0) ?? tiers[0]);

  function computeTierPrice(tier: VisitTier): number {
    if (tier.surcharge_value === 0) return basePrice;
    return tier.surcharge_type === "flat"
      ? basePrice + tier.surcharge_value
      : basePrice + basePrice * tier.surcharge_value / 100;
  }
  const sortedTiers = [...tiers].sort((a, b) => a.days - b.days);
  const tierIndex = sortedTiers.findIndex(t => t.label === activeTier.label);
  const startOffset = tierIndex > 0 ? sortedTiers[tierIndex - 1].days : 0;
  const days = Array.from(
    { length: activeTier.days - startOffset },
    (_, i) => addDays(today, startOffset + i)
  );

  const { data: availData, isLoading: availLoading } = useQuery({
    queryKey: ["avail-prefs", taskerId, selectedDate ? isoDateString(selectedDate) : null],
    queryFn: () => getAvailableSlots(taskerId, isoDateString(selectedDate!)),
    enabled: !!selectedDate && !!taskerId,
  });

  const isAvailable = (pref: TimePreference) => {
    if (!availData) return true;
    if (!availData.available) return false;
    return availData[pref] !== false;
  };

  const isFull = (pref: TimePreference) => {
    if (!availData?.pending_count) return false;
    return (availData.pending_count as Record<string, number>)[pref] >= 2;
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>When do you need this?</Text>

        <Text style={styles.sectionLabel}>Visit speed</Text>
        <View style={styles.tiersRow}>
          {tiers.map((tier) => {
            const isSelected = activeTier.label === tier.label;
            const tierPrice = computeTierPrice(tier);
            const surchargeLabel = tier.surcharge_value === 0
              ? null
              : tier.surcharge_type === "flat"
                ? `+Rs. ${tier.surcharge_value.toLocaleString()}`
                : `+${tier.surcharge_value}%`;
            return (
              <Pressable
                key={tier.label}
                style={[styles.tierChip, isSelected && styles.tierChipSelected]}
                onPress={() => {
                  setSelectedTier(tier);
                  setSelectedDate(null);
                  setSelectedPref(null);
                }}
              >
                <Text style={[styles.tierChipLabel, isSelected && styles.tierChipLabelSelected]}>
                  {tier.label}
                </Text>
                <Text style={[styles.tierChipDays, isSelected && styles.tierChipDaysSelected]}>
                  Within {tier.days}d
                </Text>
                {isSelected && basePrice > 0 ? (
                  <Text style={[styles.tierChipPrice, styles.tierChipPriceSelected]}>
                    Rs. {Math.round(tierPrice).toLocaleString()}
                  </Text>
                ) : surchargeLabel ? (
                  <Text style={styles.tierChipPrice}>{surchargeLabel}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
          {days.map((d) => {
            const isSelected = selectedDate && isoDateString(selectedDate) === isoDateString(d);
            return (
              <DateChip
                key={isoDateString(d)}
                date={d}
                selected={!!isSelected}
                onPress={() => {
                  setSelectedDate(d);
                  setSelectedPref(null);
                }}
              />
            );
          })}
        </ScrollView>

        {selectedDate && (
          <View style={styles.prefsSection}>
            <Text style={styles.sectionLabel}>Preferred time of day</Text>

            {availLoading ? (
              <SkeletonCard variant="timeslot" />
            ) : availData && !availData.available ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
                <Text style={styles.emptyTitle}>Not available</Text>
                <Text style={styles.emptySub}>Tasker is not available on this day. Try another date.</Text>
              </View>
            ) : (
              <View style={styles.prefGrid}>
                {TIME_PREFS.map((pref) => {
                  const available = isAvailable(pref.key);
                  const full = available && isFull(pref.key);
                  const disabled = !available || full;
                  const selected = selectedPref === pref.key;
                  return (
                    <Pressable
                      key={pref.key}
                      style={[
                        styles.prefCard,
                        selected && styles.prefCardSelected,
                        disabled && styles.prefCardDisabled,
                      ]}
                      onPress={() => !disabled && setSelectedPref(pref.key)}
                      disabled={disabled}
                    >
                      <Ionicons
                        name={pref.icon as any}
                        size={28}
                        color={selected ? colors.brandGreen : disabled ? colors.placeholder : colors.text}
                      />
                      <Text style={[styles.prefLabel, selected && styles.prefLabelSelected, disabled && styles.prefLabelDisabled]}>
                        {pref.label}
                      </Text>
                      <Text style={[styles.prefSub, disabled && styles.prefSubDisabled]}>
                        {!available ? "Unavailable" : full ? "Full" : pref.sub}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {selectedDate && selectedPref && (
          <View style={styles.selectionSummary}>
            <Text style={styles.sectionLabel}>Your selection</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={20} color={colors.brandGreen} />
                <Text style={styles.summaryText}>{format(selectedDate, "EEEE, d MMMM")}</Text>
              </View>
              <View style={[styles.summaryItem, { marginTop: spacing.sm }]}>
                <Ionicons name="time" size={20} color={colors.brandGreen} />
                <Text style={styles.summaryText}>
                  {TIME_PREFS.find(p => p.key === selectedPref)?.label} — {TIME_PREFS.find(p => p.key === selectedPref)?.sub}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <StickyPriceCTA
        label="Continue"
        price={basePrice > 0 ? Math.round(computeTierPrice(activeTier)).toLocaleString() : undefined}
        onPress={() =>
          navigation.navigate("ServiceSpecific", {
            gigId,
            taskerId,
            address,
            latitude,
            longitude,
            scheduledAt: selectedDate ? isoDateString(selectedDate) : "",
            timePreference: selectedPref ?? undefined,
            selectedTierLabel: activeTier.label,
            category: gig?.category ?? "General",
          })
        }
        disabled={!selectedDate || !selectedPref}
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  tiersRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  tierChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: 4,
  },
  tierChipSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreenLight,
  },
  tierChipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  tierChipLabelSelected: {
    color: colors.brandGreen,
  },
  tierChipDays: {
    fontSize: 12,
    color: colors.subtext,
  },
  tierChipDaysSelected: {
    color: colors.brandGreen,
  },
  tierChipPrice: {
    fontSize: 11,
    color: colors.placeholder,
    fontWeight: "600",
  },
  tierChipPriceSelected: {
    color: colors.brandGreen,
  },
  daysScroll: {
    marginBottom: spacing.xl,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  prefsSection: {
    marginBottom: spacing.xl,
  },
  prefGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  prefCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: 6,
  },
  prefCardSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreenLight,
  },
  prefCardDisabled: {
    opacity: 0.4,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  prefLabelSelected: {
    color: colors.brandGreen,
  },
  prefLabelDisabled: {
    color: colors.placeholder,
  },
  prefSub: {
    fontSize: 11,
    color: colors.subtext,
    textAlign: "center",
  },
  prefSubDisabled: {
    color: colors.placeholder,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
    textAlign: "center",
  },
  selectionSummary: {
    marginTop: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandGreen + "20",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.md,
  },
});
