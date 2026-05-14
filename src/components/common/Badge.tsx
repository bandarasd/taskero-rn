import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { TaskStatus } from "../../types";

type Props = {
  label: string;
  color?: string;
  bg?: string;
  style?: ViewStyle;
};

export function Badge({ label, color, bg, style }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: bg ?? colors.brandGreenLight }, style]}>
      <Text style={[styles.text, { color: color ?? colors.brandGreen }]}>{label}</Text>
    </View>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus | string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: "Pending",     color: "#92400E", bg: colors.warningLight },
    quoted:      { label: "Quote Ready", color: "#1D4ED8", bg: colors.infoLight },
    accepted:    { label: "Upcoming",    color: "#065F46", bg: colors.successLight },
    in_progress: { label: "In Progress", color: "#1D4ED8", bg: colors.infoLight },
    completed:   { label: "Completed",   color: "#065F46", bg: colors.successLight },
    canceled:    { label: "Cancelled",   color: "#991B1B", bg: colors.dangerLight },
    declined:    { label: "Declined",    color: "#991B1B", bg: colors.dangerLight },
  };
  const cfg = map[status] ?? { label: status, color: colors.subtext, bg: colors.borderLight };
  return <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, fontWeight: "600" },
});
