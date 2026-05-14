import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { APITask, ServiceCategory } from "../../types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { TaskStatusBadge } from "../common/Badge";
import { Avatar } from "../common/Avatar";

type Props = { task: APITask; onPress: () => void };

const CATEGORY_IMAGES: Record<string, string> = {
  Cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6954?q=80&w=800&auto=format&fit=crop",
  Plumbing: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
  Laundry: "https://images.unsplash.com/photo-1545173168-9f1947eebb0f?q=80&w=800&auto=format&fit=crop",
  Painting: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800&auto=format&fit=crop",
  Repairing: "https://images.unsplash.com/photo-1581244276891-83393a899971?q=80&w=800&auto=format&fit=crop",
  Electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop",
  Assembly: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=800&auto=format&fit=crop",
  Carpentry: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop",
  Moving: "https://images.unsplash.com/photo-1584931423298-c576fda54bd2?q=80&w=800&auto=format&fit=crop",
  Gardening: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=800&auto=format&fit=crop",
  General: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop",
};

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

  const category = (task.category || task.gig?.category || "General") as string;
  const imageUri = task.attachments?.[0] || task.gig?.attachments?.[0] || CATEGORY_IMAGES[category] || CATEGORY_IMAGES.General;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.contentRow}>
        <View style={styles.mainInfo}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {task.gig?.title ?? task.title ?? "Service Request"}
            </Text>
          </View>
          
          <View style={styles.metaRow}>
            <Text style={styles.date}>{fmtDate(task.scheduled_at)}</Text>
            <View style={styles.statusBadgeContainer}>
              <TaskStatusBadge status={task.status} />
            </View>
          </View>

          <Text style={styles.location} numberOfLines={1}>
            📍 {task.location_address ?? "Location not set"}
          </Text>

          <View style={styles.footer}>
            <View style={styles.customerRow}>
              <Avatar uri={task.customer?.avatar_url} name={customerName} size={24} />
              <Text style={styles.customerName}>{customerName}</Text>
            </View>
            <Text style={styles.price}>
              {task.quoted_price != null ? `$${task.quoted_price}` : task.base_price != null ? `$${task.base_price}` : "Pending"}
            </Text>
          </View>
        </View>

        <Image source={{ uri: imageUri }} style={styles.jobImage} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contentRow: {
    flexDirection: "row",
    gap: 16,
  },
  mainInfo: {
    flex: 1,
  },
  jobImage: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: colors.brandGreen,
    fontWeight: "600",
  },
  statusBadgeContainer: {
    transform: [{ scale: 0.85 }],
    marginLeft: -4,
  },
  location: {
    fontSize: 13,
    color: colors.subtext,
    marginBottom: 12,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customerName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
});

