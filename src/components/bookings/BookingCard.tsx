import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { APITask } from "../../types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { TaskStatusBadge } from "../common/Badge";
import { Avatar } from "../common/Avatar";

type Props = { task: APITask; onPress: () => void };

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BookingCard({ task, onPress }: Props) {
  const workerName = task.tasker
    ? `${task.tasker.first_name ?? ""} ${task.tasker.last_name ?? ""}`.trim()
    : "Worker";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{task.gig?.title ?? task.title ?? "Service"}</Text>
          <Text style={styles.category}>{task.category}</Text>
        </View>
        <TaskStatusBadge status={task.status} />
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <Avatar uri={task.tasker?.avatar_url} name={workerName} size={32} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.workerName}>{workerName}</Text>
          <Text style={styles.date}>{fmtDate(task.scheduled_at)}</Text>
        </View>
        <Text style={styles.price}>
          {task.quoted_price != null
            ? `$${task.quoted_price}`
            : task.base_price != null
            ? `$${task.base_price}`
            : "—"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 },
  category: { fontSize: 12, color: colors.subtext },
  divider: { height: 1, backgroundColor: colors.borderLight, marginBottom: 12 },
  footer: { flexDirection: "row", alignItems: "center" },
  workerName: { fontSize: 13, fontWeight: "600", color: colors.text },
  date: { fontSize: 12, color: colors.subtext },
  price: { fontSize: 16, fontWeight: "700", color: colors.brandGreen },
});
