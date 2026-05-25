import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getUserById } from "../services/userService";
import { getWorkerGigs } from "../services/gigService";
import { getTaskerReviews } from "../services/reviewService";
import { createThread } from "../services/chatService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Avatar } from "../components/common/Avatar";
import { StarRating } from "../components/gigs/StarRating";
import { Button } from "../components/common/Button";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useAuth } from "../store/authStore";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";
import type { Gig } from "../types";

type RouteProps = RouteProp<CustomerStackParamList, "TaskerProfile">;
type Nav = NativeStackNavigationProp<CustomerStackParamList>;

function formatReviewDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function TaskerProfileScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { taskerId } = route.params;
  const { dbUserId } = useAuth();
  const insets = useSafeAreaInsets();

  const [threadLoading, setThreadLoading] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(5);

  const { data: tasker, isLoading: taskerLoading, isError: taskerError } = useQuery({
    queryKey: ["user", taskerId],
    queryFn: () => getUserById(taskerId),
    retry: 1,
  });

  const { data: gigsData } = useQuery({
    queryKey: ["workerGigs", taskerId],
    queryFn: () => getWorkerGigs(taskerId, 1, 20),
    retry: 1,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["taskerReviews", taskerId],
    queryFn: () => getTaskerReviews(taskerId, 1, 5),
    retry: 1,
  });

  if (taskerLoading) return <LoadingSpinner />;

  if (taskerError || !tasker) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", gap: 12 }]}>
        <StatusBar barStyle="dark-content" />
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.floatingBtn, { backgroundColor: colors.border, position: "relative" }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.subtext, fontSize: 15 }}>Could not load profile.</Text>
      </View>
    );
  }

  const gigs: Gig[] = gigsData?.data ?? [];
  const reviews = reviewsData?.data ?? [];

  const fullName = tasker
    ? `${tasker.first_name ?? ""} ${tasker.last_name ?? ""}`.trim()
    : route.params.taskerName ?? "Tasker";

  const isTopRated = (tasker?.completion_rate ?? 0) >= 90;
  const memberSince = tasker?.created_at ? new Date(tasker.created_at).getFullYear() : null;
  const serviceRadius = tasker?.service_radius ?? null;

  const derivedRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
  const derivedReviewCount = reviews.length > 0 ? reviews.length : null;

  const taskerRating =
    gigs.length > 0
      ? (gigs[0].rating ?? derivedRating ?? tasker?.rating ?? null)
      : (tasker?.rating ?? derivedRating ?? null);
  const taskerReviewCount =
    gigs.length > 0
      ? (gigs[0].review_count ?? derivedReviewCount ?? tasker?.review_count ?? null)
      : (tasker?.review_count ?? derivedReviewCount ?? null);

  const topGigId =
    gigs.length > 0
      ? gigs.reduce((best, g) => ((g.rating ?? 0) > (best.rating ?? 0) ? g : best)).id
      : null;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxBreakdownCount = Math.max(...ratingBreakdown.map((b) => b.count), 1);

  const ratingDisplay = taskerRating != null && taskerRating > 0 ? taskerRating.toFixed(1) : "—";
  const completionDisplay =
    tasker?.completion_rate != null ? `${Math.round(tasker.completion_rate)}%` : "—";

  const handleMessage = async () => {
    if (!dbUserId) return;
    setThreadLoading(true);
    try {
      const thread = await createThread(dbUserId, taskerId);
      navigation.navigate("Chat", { threadId: thread.id, otherUserName: fullName });
    } catch {
      Alert.alert("Error", "Could not start conversation");
    } finally {
      setThreadLoading(false);
    }
  };

  const handleBookGig = (gig: Gig) => {
    setBookModalVisible(false);
    navigation.navigate("BookingFlow", { gigId: gig.id });
  };

  const getThumbUri = (gig: Gig): string | null => {
    if (!gig.attachments || gig.attachments.length === 0) return null;
    return typeof gig.attachments[0] === "string"
      ? gig.attachments[0]
      : (gig.attachments[0] as { url?: string })?.url ?? null;
  };

  const showRatingBlock = reviews.length > 0 || (taskerRating != null && taskerRating > 0);
  const longBio = (tasker?.bio?.length ?? 0) > 200;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Floating back button */}
      <View style={[styles.floatingBack, { top: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.floatingBtn}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >
        {/* ── Hero Header ── */}
        <View style={[styles.heroSection, { paddingTop: insets.top + 10 }]}>
          <View style={styles.heroAvatarRing}>
            <Avatar uri={tasker?.avatar_url} name={fullName} size={96} />
          </View>
          <Text style={styles.heroName}>{fullName}</Text>

          <View style={styles.heroBadgesRow}>
            {isTopRated && (
              <View style={[styles.heroPill, { backgroundColor: colors.brandGreen }]}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={[styles.heroPillText, { color: "#fff" }]}>Top Rated</Text>
              </View>
            )}
            <View style={styles.frostedPill}>
              <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.frostedPillText}>Verified</Text>
            </View>
            {memberSince && (
              <View style={styles.frostedPill}>
                <Text style={styles.frostedPillText}>Member since {memberSince}</Text>
              </View>
            )}
          </View>

          {serviceRadius && (
            <Text style={styles.heroMeta}>Within {serviceRadius} km</Text>
          )}
        </View>

        {/* ── Stats Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <View style={styles.chip}>
            <Ionicons name="briefcase-outline" size={14} color={colors.subtext} />
            <Text style={styles.chipText}>{tasker?.completed_jobs ?? 0} tasks completed</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.brandGreen} />
            <Text style={[styles.chipText, { color: colors.brandGreen }]}>{completionDisplay} completion</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="flash-outline" size={14} color={colors.warning} />
            <Text style={[styles.chipText, { color: colors.warning }]}>Responds quickly</Text>
          </View>
        </ScrollView>

        {/* ── Rating Summary ── */}
        {showRatingBlock && (
          <View style={styles.ratingSummaryCard}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              {/* Left: big number */}
              <View style={{ alignItems: "center", width: 88 }}>
                <Text style={styles.ratingBigNumber}>{ratingDisplay}</Text>
                <StarRating value={taskerRating ?? 0} size={16} />
                <Text style={styles.ratingSubtext}>{taskerReviewCount ?? 0} reviews</Text>
              </View>

              {/* Right: breakdown bars */}
              <View style={{ flex: 1, marginLeft: spacing.lg }}>
                {ratingBreakdown.map(({ star, count }) => {
                  const pct = reviews.length > 0
                    ? Math.round((count / maxBreakdownCount) * 100)
                    : 0;
                  return (
                    <View key={star} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{star}</Text>
                      <Ionicons name="star" size={10} color={colors.warning} />
                      <View style={styles.breakdownTrack}>
                        <View style={[styles.breakdownFill, { width: `${pct}%` as any }]} />
                      </View>
                      <Text style={styles.breakdownCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ── About ── */}
        {tasker?.bio ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text
              style={styles.bioText}
              numberOfLines={bioExpanded ? undefined : 4}
            >
              {tasker.bio}
            </Text>
            {longBio && (
              <Pressable onPress={() => setBioExpanded((v) => !v)} style={styles.bioToggleBtn}>
                <Text style={styles.bioToggleText}>
                  {bioExpanded ? "Show less" : "Show more"}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* ── Services ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            {gigs.length > 0 && (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{gigs.length}</Text>
              </View>
            )}
          </View>

          {gigs.length === 0 ? (
            <Text style={styles.emptyText}>No active services yet.</Text>
          ) : (
            gigs.map((gig) => {
              const isTop = gig.id === topGigId && gigs.length > 1;
              const thumbUri = getThumbUri(gig);
              return (
                <Pressable
                  key={gig.id}
                  style={styles.serviceCard}
                  onPress={() => navigation.navigate("ServiceDetail", { gigId: gig.id })}
                >
                  {/* Thumbnail */}
                  <View style={styles.serviceThumb}>
                    {thumbUri ? (
                      <Image source={{ uri: thumbUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                        <Ionicons name="construct-outline" size={28} color={colors.border} />
                      </View>
                    )}
                    {isTop && (
                      <View style={styles.popularPill}>
                        <Text style={styles.popularPillText}>Popular</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle} numberOfLines={2}>{gig.title}</Text>
                    <View style={[styles.gigTagPill, { marginTop: 4 }]}>
                      <Text style={styles.gigTagText}>{gig.category}</Text>
                    </View>
                    <View style={styles.serviceBottomRow}>
                      <Text style={styles.servicePrice}>Rs. {gig.base_price}</Text>
                      {gig.rating != null && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                          <Ionicons name="star" size={11} color={colors.warning} />
                          <Text style={styles.serviceRating}>{gig.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color={colors.border} style={{ alignSelf: "center", paddingRight: 12 }} />
                </Pressable>
              );
            })
          )}
        </View>

        {/* ── Reviews ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {(taskerReviewCount ?? 0) > 0 && (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{taskerReviewCount}</Text>
              </View>
            )}
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          ) : (
            <>
              {reviews.slice(0, reviewsVisible).map((r) => {
                const gigTitle = r.gig_id ? gigs.find((g) => g.id === r.gig_id)?.title : null;
                return (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Avatar uri={r.reviewer?.avatar_url} name={r.reviewer?.first_name ?? "A"} size={40} />
                      <View style={styles.reviewerColumn}>
                        <Text style={styles.reviewerName}>{r.reviewer?.first_name ?? "Anonymous"}</Text>
                        <StarRating value={r.rating} size={12} />
                      </View>
                      <Text style={styles.reviewDateRight}>{formatReviewDate(r.created_at)}</Text>
                    </View>

                    {r.body ? (
                      <Text style={styles.reviewBody}>{r.body}</Text>
                    ) : (
                      <Text style={styles.reviewBodyEmpty}>No written review</Text>
                    )}

                    {gigTitle && (
                      <View style={styles.gigTagPill}>
                        <Text style={styles.gigTagText}>for {gigTitle}</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* TODO: wire up full pagination — currently extends visible count within fetched data only */}
              {(taskerReviewCount ?? 0) > reviews.length && (
                <Pressable
                  style={styles.loadMoreBtn}
                  onPress={() => setReviewsVisible((v) => v + 5)}
                >
                  <Text style={styles.loadMoreText}>Load more reviews</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(spacing.lg, insets.bottom) }]}>
        <Pressable onPress={handleMessage} style={styles.messageBtn} disabled={threadLoading}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
          <Text style={styles.messageBtnText}>Message</Text>
        </Pressable>
        <Button
          label={gigs.length === 1 ? "Book Now" : "Book a Service"}
          onPress={() => {
            if (gigs.length === 1) {
              handleBookGig(gigs[0]);
            } else {
              setBookModalVisible(true);
            }
          }}
          style={styles.bookBtn}
        />
      </View>

      {/* ── Book picker modal ── */}
      <Modal
        visible={bookModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBookModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBookModalVisible(false)}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose a service</Text>
            {gigs.map((gig) => {
              const thumbUri = getThumbUri(gig);
              return (
                <Pressable
                  key={gig.id}
                  style={styles.modalGigRow}
                  onPress={() => handleBookGig(gig)}
                >
                  {thumbUri ? (
                    <Image source={{ uri: thumbUri }} style={styles.modalThumb} />
                  ) : (
                    <View style={[styles.modalThumb, styles.modalThumbEmpty]}>
                      <Ionicons name="construct-outline" size={18} color={colors.border} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.modalGigName} numberOfLines={1}>{gig.title}</Text>
                    <Text style={styles.modalGigPrice}>from Rs. {gig.base_price}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 6,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  floatingBack: { position: "absolute", left: spacing.lg, zIndex: 10 },
  floatingBtn: {
    backgroundColor: "rgba(0,0,0,0.45)",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero
  heroSection: {
    backgroundColor: "#1C1C1E",
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  heroAvatarRing: {
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "hidden",
    marginBottom: 12,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
    marginBottom: 10,
    textAlign: "center",
  },
  heroBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  heroPillText: { fontSize: 12, fontWeight: "700" },
  frostedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  frostedPillText: { fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: "500" },
  heroMeta: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  // Stats chips
  chipsScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...cardShadow,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },

  // Rating summary
  ratingSummaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: 4,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  ratingBigNumber: {
    fontSize: 48,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -2,
    lineHeight: 52,
  },
  ratingSubtext: { fontSize: 12, color: colors.subtext, marginTop: 4 },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  breakdownLabel: { fontSize: 12, color: colors.subtext, width: 14, textAlign: "right" },
  breakdownTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  breakdownFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandGreen,
  },
  breakdownCount: { fontSize: 11, color: colors.subtext, width: 20, textAlign: "right" },

  // Section wrapper
  sectionContainer: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.subtext,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  countPill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countPillText: { fontSize: 11, fontWeight: "700", color: colors.brandGreen },
  emptyText: { fontSize: 14, color: colors.subtext, fontStyle: "italic" },

  // Bio
  bioText: { fontSize: 15, color: colors.text, lineHeight: 24 },
  bioToggleBtn: { marginTop: 6 },
  bioToggleText: { fontSize: 13, fontWeight: "600", color: colors.brandGreen },

  // Service cards (vertical list)
  serviceCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: "hidden",
    alignItems: "stretch",
    ...cardShadow,
  },
  serviceThumb: {
    width: 88,
    height: 88,
    backgroundColor: colors.borderLight,
  },
  popularPill: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.warning,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  popularPillText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  serviceInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  serviceTitle: { fontSize: 15, fontWeight: "700", color: colors.text, lineHeight: 20 },
  serviceBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  servicePrice: { fontSize: 15, fontWeight: "800", color: colors.brandGreen },
  serviceRating: { fontSize: 12, color: colors.subtext },

  // Gig/service tag pill
  gigTagPill: {
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  gigTagText: { fontSize: 11, color: colors.subtext, fontWeight: "500" },

  // Review cards
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewerColumn: { flex: 1, marginLeft: 10 },
  reviewerName: { fontSize: 14, fontWeight: "700", color: colors.text },
  reviewDateRight: { fontSize: 11, color: colors.subtext },
  reviewBody: { fontSize: 14, color: colors.text, lineHeight: 22, marginTop: 4 },
  reviewBodyEmpty: { fontSize: 13, color: colors.placeholder, fontStyle: "italic" },
  loadMoreBtn: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  loadMoreText: { fontSize: 13, fontWeight: "600", color: colors.text },

  // Footer
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
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.text,
    justifyContent: "center",
  },
  messageBtnText: { fontSize: 14, fontWeight: "600", color: colors.text },
  bookBtn: { flex: 1, height: 52, backgroundColor: colors.brandGreen, borderRadius: radius.xl },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 12 },
  modalGigRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
  },
  modalThumbEmpty: { alignItems: "center", justifyContent: "center" },
  modalGigName: { fontSize: 15, fontWeight: "600", color: colors.text },
  modalGigPrice: { fontSize: 13, color: colors.subtext, marginTop: 2 },
});
