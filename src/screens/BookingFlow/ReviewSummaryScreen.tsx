import React, { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getGigById } from "../../services/gigService";
import { BookingStepDots } from "../../components/booking/BookingStepDots";
import { BookingToast, BookingToastHandle } from "../../components/booking/BookingToast";
import { StickyPriceCTA } from "../../components/booking/StickyPriceCTA";
import { Avatar } from "../../components/common/Avatar";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import type { VisitTier } from "../../types";

type RouteProps = RouteProp<BookingFlowParamList, "ReviewSummary">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

const TIME_PREF_LABEL: Record<string, string> = {
  morning: "Morning (8 AM – 12 PM)",
  afternoon: "Afternoon (12 PM – 5 PM)",
  evening: "Evening (5 PM – 8 PM)",
};

function tierSurchargeLabel(tier: VisitTier): string {
  if (tier.surcharge_value === 0) return "";
  return tier.surcharge_type === "flat"
    ? `+Rs. ${tier.surcharge_value.toLocaleString()}`
    : `+${tier.surcharge_value}%`;
}

function tierSurchargePricingLabel(basePrice: number, tier: VisitTier): string {
  if (tier.surcharge_value === 0) return "";
  if (tier.surcharge_type === "flat") {
    return `+Rs. ${tier.surcharge_value.toLocaleString()}`;
  }
  const amount = Math.round(basePrice * tier.surcharge_value / 100);
  return `+Rs. ${amount.toLocaleString()} (${tier.surcharge_value}%)`;
}

function computeTierPrice(basePrice: number, tier: VisitTier): number {
  if (tier.surcharge_value === 0) return basePrice;
  return tier.surcharge_type === "flat"
    ? basePrice + tier.surcharge_value
    : basePrice + basePrice * tier.surcharge_value / 100;
}

export function ReviewSummaryScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const {
    gigId, taskerId, address, latitude, longitude,
    scheduledAt, timePreference, selectedTierLabel, category, details, basePrice: rawBasePrice, notes, imageUris,
  } = route.params;
  const basePrice = Number(rawBasePrice);
  const toastRef = useRef<BookingToastHandle>(null);

  const { data: gig } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  const tiers: VisitTier[] = gig?.visit_tiers?.length
    ? gig.visit_tiers
    : [{ label: "Standard", days: 7, surcharge_type: "percent", surcharge_value: 0 }];

  const selectedTier = tiers.find(t => t.label === selectedTierLabel) ?? tiers.find(t => t.surcharge_value === 0) ?? tiers[0];
  const totalPrice = computeTierPrice(basePrice, selectedTier);

  const workerName = gig?.tasker
    ? `${gig.tasker.first_name ?? ""} ${gig.tasker.last_name ?? ""}`.trim()
    : "Worker";

  const handleConfirm = () => {
    navigation.navigate("Payment", {
      gigId, taskerId, address, latitude, longitude,
      scheduledAt, timePreference,
      selectedTierLabel: selectedTier.label,
      category, details, basePrice: basePrice, notes, imageUris,
    });
  };

  const detailEntries = Object.entries(details ?? {}).filter(([, v]) => String(v).trim().length > 0);

  const SummaryRow = ({ label, value, icon }: { label: string; value: string; icon?: string }) => (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLabelWrap}>
        {icon && <Ionicons name={icon as any} size={18} color={colors.subtext} style={styles.rowIcon} />}
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Review</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Review your booking</Text>

        <View style={styles.workerSection}>
          <Avatar uri={gig?.tasker?.avatar_url} name={workerName} size={50} />
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{workerName}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.ratingText}>{gig?.rating?.toFixed(1) ?? "5.0"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Service details</Text>
          <SummaryRow label="Service" value={category} />
          <SummaryRow label="Location" value={address} />
          <SummaryRow
            label="Preferred date"
            value={scheduledAt ? format(new Date(scheduledAt), "EEE, d MMM") : "—"}
          />
          {timePreference && (
            <SummaryRow label="Time of day" value={TIME_PREF_LABEL[timePreference] ?? timePreference} />
          )}
          <SummaryRow
            label="Visit speed"
            value={`${selectedTier.label} — within ${selectedTier.days} day${selectedTier.days !== 1 ? "s" : ""}${tierSurchargeLabel(selectedTier) ? ` (${tierSurchargeLabel(selectedTier)})` : ""}`}
          />
          {detailEntries.map(([k, v]) => (
            <SummaryRow
              key={k}
              label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              value={String(v)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pricing</Text>
          <SummaryRow label="Base rate" value={`Rs. ${basePrice.toLocaleString()}`} />
          {selectedTier.surcharge_value > 0 && (
            <SummaryRow
              label={`${selectedTier.label} surcharge`}
              value={tierSurchargePricingLabel(basePrice, selectedTier)}
            />
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>Rs. {Math.round(totalPrice).toLocaleString()}</Text>
          </View>
          <View style={styles.amberNote}>
            <Ionicons name="warning" size={16} color={colors.warning} />
            <Text style={styles.amberNoteText}>Final price set after tasker reviews & quotes</Text>
          </View>
        </View>

        {notes && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <Text style={styles.notesText}>"{notes}"</Text>
            </View>
          </>
        )}

        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By continuing you agree to Taskero's{"\n"}
            <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>

      <StickyPriceCTA
        label="Continue to Payment"
        price={Math.round(totalPrice).toLocaleString()}
        onPress={handleConfirm}
      />

      <BookingToast ref={toastRef} />
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  content: { padding: spacing.lg, paddingBottom: 120 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xl,
  },
  workerSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  workerInfo: {
    marginLeft: spacing.md,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    color: colors.subtext,
    marginLeft: 4,
    fontWeight: "600",
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  summaryLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.subtext,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brandGreen,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  amberNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  amberNoteText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.warning,
    marginLeft: spacing.xs,
  },
  notesText: {
    fontSize: 15,
    color: colors.text,
    fontStyle: "italic",
    lineHeight: 22,
  },
  termsSection: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  termsText: {
    fontSize: 13,
    color: colors.subtext,
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: colors.brandGreen,
    fontWeight: "600",
  },
});
