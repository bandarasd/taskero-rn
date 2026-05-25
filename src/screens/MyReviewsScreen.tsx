import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getCustomerTasks } from "../services/taskService";
import { getTaskReviews } from "../services/reviewService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useAuth } from "../store/authStore";
import type { Task } from "../types";

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? "#F59E0B" : "#D1D5DB"}
        />
      ))}
    </View>
  );
}

function ReviewCard({ task }: { task: Task }) {
  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", "task", task.id],
    queryFn: () => getTaskReviews(task.id, 1, 10),
    enabled: task.status === "completed",
  });

  const review = reviewsData?.data?.[0];
  const date = task.created_at
    ? new Date(task.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="construct-outline" size={18} color={colors.brandGreen} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {task.title ?? task.category ?? "Task"}
          </Text>
          <Text style={styles.cardDate}>{date}</Text>
        </View>
      </View>

      {review ? (
        <View style={styles.reviewBody}>
          <StarRow rating={review.rating} />
          {review.body ? (
            <Text style={styles.reviewText}>{review.body}</Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.noReview}>No review left</Text>
      )}
    </View>
  );
}

export function MyReviewsScreen() {
  const { dbUserId } = useAuth();

  const { data: tasksData, isLoading, refetch, isRefetching } = useInfiniteQuery({
    queryKey: ["tasks", "customer", dbUserId],
    queryFn: ({ pageParam = 1 }) => getCustomerTasks(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });

  const completedTasks = (tasksData?.pages.flatMap((p) => p.data) ?? []).filter((t) => t.status === "completed");

  if (isLoading) return <LoadingSpinner />;

  return (
    <FlatList
      data={completedTasks}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => <ReviewCard task={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListEmptyComponent={
        <EmptyState
          icon="star-outline"
          title="No reviews yet"
          subtitle="Your reviews will appear here after completing a booking."
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  cardDate: { fontSize: 12, color: colors.subtext, marginTop: 2 },
  reviewBody: { marginTop: spacing.sm, paddingLeft: 48 },
  stars: { flexDirection: "row", gap: 2 },
  reviewText: { fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 20 },
  noReview: { fontSize: 13, color: colors.subtext, marginTop: spacing.sm, paddingLeft: 48 },
  separator: { height: spacing.sm },
});
