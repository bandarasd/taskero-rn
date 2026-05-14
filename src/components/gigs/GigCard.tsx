import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gig } from "../../types";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { StarRating } from "./StarRating";

type Props = {
  gig: Gig;
  onPress: () => void;
};

export function GigCard({ gig, onPress }: Props) {
  const workerName = gig.tasker
    ? `${gig.tasker.first_name ?? ""} ${gig.tasker.last_name ?? ""}`.trim()
    : "Worker";
  const image = gig.attachments?.[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>🛠️</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{gig.title}</Text>
        <Text style={styles.worker} numberOfLines={1}>{workerName}</Text>
        <View style={styles.footer}>
          <StarRating value={gig.rating ?? 0} size={13} />
          <Text style={styles.reviewCount}> ({gig.review_count ?? 0})</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.price}>${gig.base_price}/hr</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  image: { width: "100%", height: 120, resizeMode: "cover" },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { fontSize: 36 },
  body: { padding: 12 },
  title: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 2 },
  worker: { fontSize: 12, color: colors.subtext, marginBottom: 8 },
  footer: { flexDirection: "row", alignItems: "center" },
  reviewCount: { fontSize: 12, color: colors.subtext },
  price: { fontSize: 14, fontWeight: "700", color: colors.brandGreen },
});
