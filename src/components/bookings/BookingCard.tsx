import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { APITask } from "../../types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { Avatar } from "../common/Avatar";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CustomerStackParamList } from "../../navigation/stacks/CustomerStack";

type Props = { task: APITask; onPress: () => void };

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting Review", color: "#F59E0B" },
  quoted: { label: "Quote Received", color: "#3B82F6" },
  accepted: { label: "Confirmed", color: "#10B981" },
  in_progress: { label: "In Progress", color: colors.brandGreen },
  completed: { label: "Completed", color: "#6B7280" },
  canceled: { label: "Cancelled", color: "#EF4444" },
  declined: { label: "Declined", color: "#EF4444" },
};

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function BookingCard({ task, onPress }: Props) {
  const navigation = useNavigation<Nav>();
  const workerName = task.tasker
    ? `${task.tasker.first_name ?? ""} ${task.tasker.last_name ?? ""}`.trim()
    : "Worker";

  const statusInfo = STATUS_MAP[task.status] || { label: task.status, color: colors.subtext };
  const isPast = ["completed", "canceled", "declined"].includes(task.status);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Avatar uri={task.tasker?.avatar_url} name={workerName} size={52} />
        <View style={styles.contentRight}>
          <Text style={styles.title}>
            {task.gig_title ?? task.gig?.title ?? task.title ?? "Service"}
          </Text>
          <Text style={styles.meta}>
            {task.category}
            {task.created_at ? ` · Booked ${fmtDate(task.created_at)}` : ""}
            {task.scheduled_at ? ` · Scheduled ${fmtDate(task.scheduled_at)}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>

        <View style={styles.priceContainer}>
          {task.quoted_price != null || task.base_price != null ? (
            <Text style={styles.price}>Rs. {task.quoted_price ?? (Number(task.base_price ?? 0) + Number(task.surcharge_amount ?? 0))}</Text>
          ) : (
            <Text style={styles.awaitingQuote}>Awaiting quote</Text>
          )}
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>

      {isPast && task.gig_id && (
        <>
          <View style={styles.divider} />
          <Pressable
            style={styles.bookAgain}
            onPress={() => navigation.navigate("ServiceDetail", { gigId: task.gig_id! })}
          >
            <Text style={styles.bookAgainText}>Book Again</Text>
          </Pressable>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contentRight: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.subtext,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.brandGreen,
  },
  awaitingQuote: {
    fontSize: 13,
    color: colors.subtext,
    fontStyle: "italic",
  },
  chevron: {
    fontSize: 18,
    color: colors.subtext,
    marginLeft: 8,
    marginTop: -2,
  },
  bookAgain: {
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  bookAgainText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.brandGreen,
  },
});
