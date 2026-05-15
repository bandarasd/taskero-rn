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
  
  const avatarUrl = gig.tasker?.avatar_url;
  const initial = gig.tasker?.first_name ? gig.tasker.first_name[0].toUpperCase() : "W";

  const raw = gig.attachments?.[0];
  const image = typeof raw === "string" ? raw : (raw as { url?: string })?.url ?? null;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>🛠️</Text>
          </View>
        )}
        
        {/* Worker Overlay */}
        <View style={styles.workerOverlay}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <Text style={styles.workerName} numberOfLines={1}>{workerName}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{gig.title}</Text>
        <View style={styles.footer}>
          <StarRating value={gig.rating ?? 0} size={12} />
          <Text style={styles.reviewCount}> ({gig.review_count ?? 0})</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.price}>From ${gig.base_price}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: spacing.sm, // Padding for shadow
  },
  imageContainer: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  image: { 
    width: "100%", 
    height: "100%", 
    resizeMode: "cover",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  imagePlaceholder: {
    backgroundColor: colors.brandGreenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: { fontSize: 36 },
  workerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  avatarFallback: {
    backgroundColor: colors.brandGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  workerName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  body: { 
    padding: 14,
    height: 85, // Fixed height for body to keep footer aligned
    justifyContent: "space-between",
  },
  title: { 
    fontSize: 15, 
    fontWeight: "bold", 
    color: colors.text, 
    lineHeight: 20,
  },
  footer: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  reviewCount: { fontSize: 12, color: colors.subtext },
  price: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: colors.brandGreen 
  },
});

