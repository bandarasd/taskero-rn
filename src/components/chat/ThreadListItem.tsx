import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChatThread } from "../../types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { Avatar } from "../common/Avatar";

type Props = {
  thread: ChatThread;
  myId: string;
  onPress: () => void;
};

function fmtTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ThreadListItem({ thread, myId, onPress }: Props) {
  const other = thread.customer_id === myId ? thread.tasker : thread.customer;
  const otherName = other
    ? `${other.first_name ?? ""} ${other.last_name ?? ""}`.trim()
    : "User";
  const hasUnread = (thread.unread_count ?? 0) > 0;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar uri={other?.avatar_url} name={otherName} size={48} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.bold]}>{otherName}</Text>
          <Text style={styles.time}>{fmtTime(thread.last_message_at)}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.preview, hasUnread && styles.bold]} numberOfLines={1}>
            {thread.last_message ?? "Start a conversation"}
          </Text>
          {hasUnread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{thread.unread_count}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  body: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  bottomRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, color: colors.text },
  bold: { fontWeight: "700" },
  time: { fontSize: 12, color: colors.subtext },
  preview: { fontSize: 13, color: colors.subtext, flex: 1 },
  badge: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
