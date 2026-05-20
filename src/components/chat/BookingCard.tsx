import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { APITask } from "../../types";
import { TaskStatusBadge } from "../common/Badge";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";

type Props = {
  task: APITask;
  onPress: () => void;
};

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function BookingCard({ task, onPress }: Props) {
  const title = task.gig?.title ?? task.title ?? task.category ?? "Booking";
  const date = fmtDate(task.scheduled_at);

  return (
    <Pressable style={styles.card} onPress={onPress} android_ripple={{ color: colors.border }}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.brandGreen} style={{ marginRight: 6 }} />
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        <TaskStatusBadge status={task.status} />
      </View>

      {(date || task.location_address) && (
        <View style={styles.details}>
          {date && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={13} color={colors.subtext} />
              <Text style={styles.detailText}>{date}</Text>
            </View>
          )}
          {task.location_address && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={13} color={colors.subtext} />
              <Text style={styles.detailText} numberOfLines={1}>{task.location_address}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.tapHint}>Tap to view booking</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.subtext} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: 4,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  details: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    color: colors.subtext,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  tapHint: {
    fontSize: 11,
    color: colors.subtext,
    fontStyle: "italic",
  },
});
