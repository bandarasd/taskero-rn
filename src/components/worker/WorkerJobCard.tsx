import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { APITask } from "../../types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { TaskStatusBadge } from "../common/Badge";
import { Avatar } from "../common/Avatar";
import { useCategoryByName } from "../../hooks/useCategories";

type Props = { task: APITask; onPress: () => void };

function fmtDate(iso?: string | null) {
  if (!iso) return "No date set";
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric"
  }) + " • " + date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit"
  });
}

export function WorkerJobCard({ task, onPress }: Props) {
  const customerName = task.customer
    ? `${task.customer.first_name ?? ""} ${task.customer.last_name ?? ""}`.trim()
    : "Customer";

  const isPending = task.status === "pending";
  const category = (task.category || task.gig?.category || "General") as string;
  const { data: categoryData } = useCategoryByName(category);
  const toUrl = (a: unknown) => typeof a === "string" ? a : (a as { url?: string })?.url ?? null;
  const imageUri = toUrl(task.gig_attachments?.[0]) || toUrl(task.attachments?.[0]) || categoryData?.image_url || null;

  const price = task.quoted_price != null
    ? `Rs. ${task.quoted_price}`
    : task.base_price != null
    ? `Rs. ${task.base_price}`
    : "Pending";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {isPending && <View style={styles.accentBar} />}
      <View style={styles.inner}>
        {/* Header row: title + badge */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {task.gig_title ?? task.title ?? "Service Request"}
          </Text>
          <TaskStatusBadge status={task.status} />
        </View>

        {isPending && (
          <Text style={styles.actionHint}>Tap to review & accept</Text>
        )}

        <View style={styles.body}>
          <View style={styles.mainInfo}>
            {/* Date */}
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.brandGreen} />
              <Text style={styles.date}>{fmtDate(task.scheduled_at)}</Text>
            </View>

            {/* Location */}
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={colors.subtext} />
              <Text style={styles.location} numberOfLines={1}>
                {task.location_address ?? "Location not set"}
              </Text>
            </View>

            {/* Customer + Price */}
            <View style={styles.footer}>
              <View style={styles.customerRow}>
                <Avatar uri={task.customer?.avatar_url} name={customerName} size={22} />
                <View>
                  <Text style={styles.customerLabel}>Customer</Text>
                  <Text style={styles.customerName}>{customerName}</Text>
                </View>
              </View>
              <Text style={[styles.price, isPending && styles.pricePending]}>
                {price}
              </Text>
            </View>
          </View>

          <Image source={{ uri: imageUri }} style={styles.jobImage} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.brandGreen,
  },
  inner: {
    flex: 1,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  actionHint: {
    fontSize: 11,
    color: colors.brandGreen,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  body: {
    flexDirection: "row",
    gap: 12,
  },
  mainInfo: {
    flex: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  date: {
    fontSize: 13,
    color: colors.brandGreen,
    fontWeight: "600",
  },
  location: {
    fontSize: 13,
    color: colors.subtext,
    fontWeight: "500",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  customerLabel: {
    fontSize: 10,
    color: colors.subtext,
    fontWeight: "500",
    lineHeight: 13,
  },
  customerName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    lineHeight: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  pricePending: {
    color: colors.brandGreen,
  },
  jobImage: {
    width: 76,
    height: 76,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
    alignSelf: "center",
  },
});
