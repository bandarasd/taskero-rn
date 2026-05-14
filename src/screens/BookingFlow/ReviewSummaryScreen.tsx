import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createTask } from "../../services/taskService";
import { Button } from "../../components/common/Button";
import { BookingProgressBar } from "../../components/bookings/BookingProgressBar";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import type { BookingFlowParamList } from "./BookingFlowNavigator";

type RouteProps = RouteProp<BookingFlowParamList, "ReviewSummary">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

function SectionCard({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: string;
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {onEdit && (
          <Pressable onPress={onEdit} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function ReviewSummaryScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const {
    gigId, taskerId, address, latitude, longitude,
    scheduledAt, category, details, basePrice, notes,
  } = route.params;
  const { dbUserId } = useAuth();
  const [loading, setLoading] = useState(false);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const handleConfirm = async () => {
    if (!dbUserId) return;
    setLoading(true);
    try {
      const task = await createTask({
        gig_id: gigId,
        tasker_id: taskerId,
        customer_id: dbUserId,
        title: category,
        category,
        location_address: address,
        location_latitude: latitude,
        location_longitude: longitude,
        scheduled_at: scheduledAt,
        base_price: basePrice,
        notes,
        status: "pending",
      });
      navigation.navigate("PaymentSuccess", { taskId: task.id });
    } catch {
      Alert.alert("Error", "Could not create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const detailEntries = Object.entries(details ?? {}).filter(([, v]) => String(v).trim().length > 0);

  return (
    <View style={styles.container}>
      <BookingProgressBar currentStep={5} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Review Your Booking</Text>
        <Text style={styles.sub}>Check the details below before confirming.</Text>

        <SectionCard
          icon="📅"
          title="Schedule"
          onEdit={() => navigation.goBack()}
        >
          <InfoRow label="Date" value={fmtDate(scheduledAt)} />
          <InfoRow label="Time" value={fmtTime(scheduledAt)} />
          <InfoRow label="Category" value={category} />
        </SectionCard>

        <SectionCard icon="📍" title="Service Location">
          <Text style={styles.addressText}>{address}</Text>
        </SectionCard>

        {detailEntries.length > 0 && (
          <SectionCard icon="🛠️" title="Service Details">
            {detailEntries.map(([k, v]) => (
              <InfoRow
                key={k}
                label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                value={String(v)}
              />
            ))}
          </SectionCard>
        )}

        {notes ? (
          <SectionCard icon="📝" title="Notes">
            <Text style={styles.notesText}>{notes}</Text>
          </SectionCard>
        ) : null}

        {/* Price card */}
        <View style={styles.priceCard}>
          <View style={styles.priceCardTop}>
            <Text style={styles.priceCardLabel}>Estimated Starting Price</Text>
            <Text style={styles.priceCardAmount}>${basePrice}<Text style={styles.priceCardUnit}>/hr</Text></Text>
          </View>
          <View style={styles.priceCardDivider} />
          <Text style={styles.priceCardNote}>
            Final price is confirmed by the worker after reviewing your job details. You'll only be charged once the service is complete.
          </Text>
        </View>

        {/* Booking terms */}
        <Text style={styles.termsText}>
          By confirming, you agree to Taskero's{" "}
          <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
          <Text style={styles.termsLink}>Cancellation Policy</Text>.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Confirm Booking" onPress={handleConfirm} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.subtext, marginBottom: 20 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.sectionHeader,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIcon: { fontSize: 16 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: colors.text, textTransform: "uppercase", letterSpacing: 0.4 },
  editLink: { fontSize: 13, fontWeight: "600", color: colors.brandGreen },
  cardBody: { paddingHorizontal: 16, paddingVertical: 12 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: { fontSize: 14, color: colors.subtext },
  infoValue: { fontSize: 14, fontWeight: "600", color: colors.text, maxWidth: "55%", textAlign: "right" },

  addressText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 22, fontStyle: "italic" },

  priceCard: {
    backgroundColor: colors.brandGreen,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 14,
  },
  priceCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 },
  priceCardLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  priceCardAmount: { fontSize: 38, fontWeight: "800", color: "#fff" },
  priceCardUnit: { fontSize: 16, fontWeight: "500", color: "rgba(255,255,255,0.8)" },
  priceCardDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 12 },
  priceCardNote: { fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 18 },

  termsText: { fontSize: 12, color: colors.subtext, textAlign: "center", lineHeight: 18, marginBottom: 8 },
  termsLink: { color: colors.brandGreen, fontWeight: "600" },

  footer: { padding: spacing.lg, paddingBottom: 36 },
});
