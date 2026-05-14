import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getTaskerReviews } from "../../services/reviewService";
import { Avatar } from "../../components/common/Avatar";
import { StarRating } from "../../components/gigs/StarRating";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";

export function WorkerReviewsScreen() {
  const { dbUserId } = useAuth();

  const { data: reviews, isLoading, refetch } = useQuery({
    queryKey: ["worker-reviews", dbUserId],
    queryFn: () => getTaskerReviews(dbUserId!),
    enabled: !!dbUserId,
  });

  const avg =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const RatingSummaryStrip = () => (
    <View style={styles.summaryStrip}>
      <View style={styles.summaryLeft}>
        <Text style={styles.summaryBigRating}>{avg.toFixed(1)}</Text>
        <StarRating value={avg} size={18} color="#F59E0B" />
      </View>
      <View style={styles.summaryRight}>
        <Text style={styles.summaryLabel}>out of 5</Text>
        <Text style={styles.summaryCount}>
          Based on {reviews?.length || 0} reviews
        </Text>
      </View>
    </View>
  );

  const SortRow = () => (
    <View style={styles.sortRow}>
      <TouchableOpacity style={styles.sortPill} activeOpacity={0.7}>
        <Text style={styles.sortPillText}>Most Recent ▼</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {!isLoading && <RatingSummaryStrip />}
      {!isLoading && reviews && reviews.length > 0 && <SortRow />}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.brandGreen}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                icon={<Ionicons name="star-outline" size={56} color="#D1D5DB" />}
                title="No reviews yet"
                message="Complete jobs to start building your reputation."
              />
            </View>
          }
          renderItem={({ item: r }) => {
            const name = r.reviewer
              ? `${r.reviewer.first_name ?? ""} ${r.reviewer.last_name ?? ""}`.trim()
              : "Anonymous";
            
            const tagLabel = r.gig_id ? "via Gig" : r.task_id ? "via Task" : null;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <Avatar uri={r.reviewer?.avatar_url} name={name} size={44} />
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{name}</Text>
                    <Text style={styles.date}>
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>{r.rating.toFixed(1)} ★</Text>
                  </View>
                </View>

                {r.body ? <Text style={styles.body}>{r.body}</Text> : null}

                {tagLabel && (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{tagLabel}</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F5F5F5",
  },
  summaryStrip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  summaryLeft: {
    alignItems: "flex-start",
  },
  summaryBigRating: {
    fontSize: 40,
    fontWeight: "800",
    color: "#000000",
    lineHeight: 48,
  },
  summaryRight: {
    flex: 1,
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  sortRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  sortPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  list: { 
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: "#F0F0F0",
    borderRadius: 999,
    padding: 1,
  },
  reviewerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  date: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratingBadgeText: {
    color: "#B45309",
    fontSize: 13,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginTop: 14,
    fontWeight: "400",
  },
  tagPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  tagPillText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyContainer: {
    marginTop: 100,
    paddingHorizontal: 40,
  },
});

