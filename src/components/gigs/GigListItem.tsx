import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gig } from "../../types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { StarRating } from "./StarRating";

type Props = { gig: Gig; onPress: () => void };

export function GigListItem({ gig, onPress }: Props) {
  const workerName = gig.tasker
    ? `${gig.tasker.first_name ?? ""} ${gig.tasker.last_name ?? ""}`.trim()
    : "Worker";
  const raw = gig.attachments?.[0];
  const image = typeof raw === "string" ? raw : (raw as { url?: string })?.url ?? null;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: 24 }}>🛠️</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{gig.title}</Text>
        <Text style={styles.worker}>{workerName}</Text>
        <View style={styles.footer}>
          <StarRating value={gig.rating ?? 0} size={12} />
          <Text style={styles.reviews}> ({gig.review_count ?? 0})</Text>
        </View>
      </View>
      <Text style={styles.price}>from Rs. {gig.base_price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 12,
  },
  image: { width: 64, height: 64, borderRadius: radius.md, resizeMode: "cover" },
  imagePlaceholder: {
    width: 64, height: 64, borderRadius: radius.md,
    backgroundColor: colors.borderLight, alignItems: "center", justifyContent: "center",
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 2 },
  worker: { fontSize: 12, color: colors.subtext, marginBottom: 4 },
  footer: { flexDirection: "row", alignItems: "center" },
  reviews: { fontSize: 11, color: colors.subtext },
  price: { fontSize: 15, fontWeight: "700", color: colors.brandGreen },
});
