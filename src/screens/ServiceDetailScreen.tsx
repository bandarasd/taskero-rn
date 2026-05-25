import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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

  const insets = useSafeAreaInsets();
  const { data: reviewsData } = useInfiniteQuery({
    queryKey: ["reviews", "gig", gigId],
    queryFn: ({ pageParam = 1 }) => getGigReviews(gigId, pageParam, 10),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!gigId,
  });
  const reviews = reviewsData?.pages.flatMap((p) => p.data) ?? [];

  const avgRating = gig?.rating ?? 0;
  const reviewCount = reviews.length;

  // Star breakdown calculation
  const ratingCounts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1
  reviews.forEach((r) => {
    const star = Math.round(r.rating);
    if (star >= 1 && star <= 5) {
      ratingCounts[5 - star]++;
    }
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

  const images = (gig.attachments ?? [])
    .map((a) => (typeof a === "string" ? a : (a as { url?: string })?.url ?? ""))
    .filter(Boolean);

  const handleShare = () => {
    Alert.alert("Share", "Sharing feature coming soon!");
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Floating Header Buttons */}
      <View style={[styles.floatingHeader, { top: insets.top + 10 }]}>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={styles.floatingButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Pressable 
          onPress={handleShare} 
          style={styles.floatingButton}
        >
          <Ionicons name="share-outline" size={24} color="white" />
        </Pressable>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
      >
        {/* Hero Image Section */}
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

        {/* Content Sheet */}
        <View style={styles.contentSheet}>
          <View style={styles.dragIndicator} />

          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{gig.category}</Text>
          </View>

          <Text style={styles.title}>{gig.title}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              from Rs. {gig.base_price}
            </Text>
          </View>

          {/* Worker strip */}
          <Pressable
            style={styles.workerStrip}
            onPress={() =>
              navigation.navigate("TaskerProfile", {
                taskerId: gig.tasker_id,
                taskerName: workerName,
              })
            }
          >
            <Avatar uri={gig.tasker?.avatar_url} name={workerName} size={44} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.workerName}>{workerName}</Text>
              <View style={styles.workerRatingRow}>
                <Ionicons name="star" size={12} color={colors.warning} />
                <Text style={styles.workerRatingText}>
                  {gig.tasker?.rating?.toFixed(1) ?? "—"} ({gig.tasker?.review_count ?? 0})
                </Text>
                {gig.tasker?.completion_rate != null && (
                  <>
                    <Text style={[styles.workerRatingText, { color: colors.borderLight }]}>  ·  </Text>
                    <Ionicons name="checkmark-circle-outline" size={12} color={colors.brandGreen} />
                    <Text style={[styles.workerRatingText, { color: colors.brandGreen }]}>
                      {gig.tasker.completion_rate}% completion
                    </Text>
                  </>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </Pressable>

          {/* About section */}
          {gig.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this service</Text>
              <Text style={styles.description}>{gig.description}</Text>
            </View>
          ) : null}

          {/* Section Divider */}
          <View style={styles.sectionSpacer} />

          {/* Reviews Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            
            {/* Reviews Summary */}
            <View style={styles.reviewsSummaryRow}>
              <View style={styles.avgRatingCol}>
                <Text style={styles.bigRatingText}>{avgRating.toFixed(1)}</Text>
                <StarRating value={avgRating} size={14} />
                <Text style={styles.totalReviewsText}>{reviewCount} reviews</Text>
              </View>
              
              <View style={styles.starsBreakdown}>
                {ratingCounts.map((count, idx) => {
                  const starLevel = 5 - idx;
                  const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                  return (
                    <View key={starLevel} style={styles.breakdownRow}>
                      <Text style={styles.breakdownStarLabel}>{starLevel}</Text>
                      <View style={styles.breakdownBarBg}>
                        <View style={[styles.breakdownBarFill, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Review List */}
            {reviews && reviews.length > 0 ? (
              reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewAccentBar} />
                  <View style={styles.reviewHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.reviewerName}>
                          {r.reviewer?.first_name ?? "Anonymous"}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                        </Text>
                      </View>
                      <StarRating value={r.rating} size={12} />
                    </View>
                  </View>
                  {r.body ? <Text style={styles.reviewBody}>{r.body}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.noReviewsText}>No reviews yet for this service.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(spacing.lg, insets.bottom) }]}>
        <Pressable 
          onPress={handleMessage} 
          style={styles.messageGhostButton}
          disabled={threadLoading}
        >
          <Text style={{ fontSize: 24 }}>💬</Text>
        </Pressable>
        <Button
          label="Book Now"
          onPress={() => navigation.navigate("BookingFlow", { gigId })}
          style={styles.bookNowButton}
          textStyle={styles.bookNowButtonText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  floatingHeader: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  floatingButton: {
    backgroundColor: "rgba(0,0,0,0.35)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexGrow: 1 },
  heroImage: { width: "100%", height: 300, resizeMode: "cover" },
  heroPlaceholder: {
    width: "100%", height: 300,
    backgroundColor: colors.borderLight,
    alignItems: "center", justifyContent: "center",
  },
  imageDots: { position: "absolute", bottom: 40, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  imageDotActive: { backgroundColor: "#fff", width: 18 },
  contentSheet: {
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background,
    paddingTop: 20,
    paddingHorizontal: spacing.lg,
    minHeight: 500,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: "600", color: colors.brandGreen },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 8 },
  priceRow: { marginBottom: 12 },
  price: { fontSize: 28, fontWeight: "800", color: colors.brandGreen },
  priceSuffix: { fontSize: 16, fontWeight: "600", color: colors.subtext },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  ratingText: { fontSize: 13, color: colors.subtext, fontWeight: "500" },
  workerStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  workerName: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 1 },
  workerRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  workerRatingText: { fontSize: 13, color: colors.subtext, fontWeight: "500" },
  viewProfileBtn: { padding: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 12 },
  description: { fontSize: 15, color: colors.text, lineHeight: 26 },
  sectionSpacer: {
    height: 8,
    backgroundColor: colors.borderLight,
    marginHorizontal: -spacing.lg,
    marginBottom: 24,
  },
  reviewsSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 24,
  },
  avgRatingCol: {
    alignItems: "center",
    width: 80,
  },
  bigRatingText: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 56,
  },
  totalReviewsText: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 4,
  },
  starsBreakdown: {
    flex: 1,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  breakdownStarLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.subtext,
    width: 10,
  },
  breakdownBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  breakdownBarFill: {
    height: "100%",
    backgroundColor: colors.brandGreen,
  },
  reviewCard: {
    position: "relative",
    paddingVertical: 14,
    paddingLeft: 14,
    marginBottom: 4,
  },
  reviewAccentBar: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    backgroundColor: colors.brandGreen,
    borderRadius: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    marginBottom: 6,
  },
  reviewerName: { fontSize: 14, fontWeight: "700", color: colors.text },
  reviewDate: { fontSize: 11, color: colors.subtext },
  reviewBody: { fontSize: 14, color: colors.text, lineHeight: 22 },
  noReviewsText: { fontSize: 14, color: colors.subtext, fontStyle: "italic" },
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
    alignItems: "center",
  },
  messageGhostButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bookNowButton: {
    flex: 1,
    height: 52,
    backgroundColor: colors.brandGreen,
    borderRadius: radius.xl,
  },
  bookNowButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
