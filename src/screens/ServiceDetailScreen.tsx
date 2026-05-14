import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getGigById } from "../services/gigService";
import { getGigReviews } from "../services/reviewService";
import { createThread } from "../services/chatService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Avatar } from "../components/common/Avatar";
import { StarRating } from "../components/gigs/StarRating";
import { Button } from "../components/common/Button";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useAuth } from "../store/authStore";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type RouteProps = RouteProp<CustomerStackParamList, "ServiceDetail">;
type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function ServiceDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId } = route.params;
  const { dbUserId } = useAuth();
  const [threadLoading, setThreadLoading] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);

  const { data: gig, isLoading } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", "gig", gigId],
    queryFn: () => getGigReviews(gigId),
    enabled: !!gigId,
  });

  const workerName = gig?.tasker
    ? `${gig.tasker.first_name ?? ""} ${gig.tasker.last_name ?? ""}`.trim()
    : "Worker";

  const handleMessage = async () => {
    if (!dbUserId || !gig?.tasker_id) return;
    setThreadLoading(true);
    try {
      const thread = await createThread(dbUserId, gig.tasker_id);
      navigation.navigate("Chat", { threadId: thread.id, otherUserName: workerName });
    } catch (e) {
      Alert.alert("Error", "Could not start conversation");
    } finally {
      setThreadLoading(false);
    }
  };

  if (isLoading || !gig) return <LoadingSpinner />;

  const images = gig.attachments ?? [];
  const previewReviews = (reviews ?? []).slice(0, 3);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Image carousel */}
        {images.length > 0 ? (
          <View>
            <Image source={{ uri: images[imageIdx] }} style={styles.heroImage} />
            {images.length > 1 && (
              <View style={styles.imageDots}>
                {images.map((_, i) => (
                  <Pressable key={i} onPress={() => setImageIdx(i)}>
                    <View style={[styles.imageDot, i === imageIdx && styles.imageDotActive]} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={{ fontSize: 64 }}>🛠️</Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{gig.category}</Text>
          </View>

          <Text style={styles.title}>{gig.title}</Text>

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <StarRating value={gig.rating ?? 0} size={16} />
            <Text style={styles.ratingText}>
              {gig.rating?.toFixed(1) ?? "0.0"} ({gig.review_count ?? 0} reviews)
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>${gig.base_price}/hr</Text>
          </View>

          {/* Worker info */}
          <View style={styles.workerCard}>
            <Avatar uri={gig.tasker?.avatar_url} name={workerName} size={52} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.workerName}>{workerName}</Text>
              {gig.tasker?.bio ? (
                <Text style={styles.workerBio} numberOfLines={2}>{gig.tasker.bio}</Text>
              ) : null}
              <View style={styles.ratingRow}>
                <StarRating value={gig.tasker?.rating ?? 0} size={13} />
                <Text style={styles.workerRatingText}>
                  {gig.tasker?.rating?.toFixed(1) ?? "—"} · {gig.tasker?.review_count ?? 0} reviews
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {gig.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this service</Text>
              <Text style={styles.description}>{gig.description}</Text>
            </View>
          ) : null}

          {/* Reviews preview */}
          {previewReviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {(reviews?.length ?? 0) > 3 && (
                  <Pressable onPress={() => navigation.navigate("GigReviews", { gigId })}>
                    <Text style={styles.seeAll}>See all {reviews?.length}</Text>
                  </Pressable>
                )}
              </View>
              {previewReviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Avatar
                      uri={r.reviewer?.avatar_url}
                      name={r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}` : "User"}
                      size={32}
                    />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.reviewerName}>
                        {r.reviewer?.first_name ?? "Anonymous"}
                      </Text>
                      <StarRating value={r.rating} size={12} />
                    </View>
                  </View>
                  {r.body ? <Text style={styles.reviewBody}>{r.body}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action buttons */}
      <View style={styles.footer}>
        <Button
          label={threadLoading ? "Opening..." : "Message"}
          onPress={handleMessage}
          variant="outline"
          style={{ flex: 1 }}
          disabled={threadLoading}
        />
        <Button
          label="Book Now"
          onPress={() => navigation.navigate("BookingFlow", { gigId })}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },
  heroImage: { width: "100%", height: 260, resizeMode: "cover" },
  heroPlaceholder: {
    width: "100%", height: 260,
    backgroundColor: colors.borderLight,
    alignItems: "center", justifyContent: "center",
  },
  imageDots: { position: "absolute", bottom: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  imageDotActive: { backgroundColor: "#fff", width: 18 },
  body: { padding: spacing.lg },
  categoryBadge: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: "600", color: colors.brandGreen },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 10 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  ratingText: { fontSize: 13, color: colors.subtext },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  priceLabel: { fontSize: 13, color: colors.subtext },
  price: { fontSize: 22, fontWeight: "700", color: colors.brandGreen },
  workerCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  workerName: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2 },
  workerBio: { fontSize: 12, color: colors.subtext, marginBottom: 4 },
  workerRatingText: { fontSize: 12, color: colors.subtext },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 12 },
  description: { fontSize: 15, color: colors.text, lineHeight: 24 },
  reviewsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 13, color: colors.brandGreen, fontWeight: "600" },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  reviewerName: { fontSize: 13, fontWeight: "600", color: colors.text },
  reviewBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
