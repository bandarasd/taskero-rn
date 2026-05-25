import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getCustomerTasks } from "../services/taskService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useAuth } from "../store/authStore";
import type { Task } from "../types";

function PaymentRow({ task }: { task: Task }) {
  const amount = task.final_price ?? task.quoted_price ?? task.base_price;
  const date = task.created_at
    ? new Date(task.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="card-outline" size={20} color={colors.brandGreen} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {task.title ?? task.category ?? "Task"}
        </Text>
        <Text style={styles.rowDate}>{date}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>
          {amount != null ? `$${Number(amount).toFixed(2)}` : "—"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            task.status === "completed" ? styles.badgeGreen : styles.badgeGray,
          ]}
        >
          <Text style={styles.statusText}>{task.status}</Text>
        </View>
      </View>
    </View>
  );
}

export function ClientPaymentMethodsScreen() {
  const { dbUserId } = useAuth();

  const { data: tasksData, isLoading, refetch, isRefetching } = useInfiniteQuery({
    queryKey: ["tasks", "customer", dbUserId],
    queryFn: ({ pageParam = 1 }) => getCustomerTasks(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });
  const tasks = tasksData?.pages.flatMap((p) => p.data) ?? [];

  const paid = tasks.filter(
    (t) => t.status === "completed" || t.status === "in_progress"
  );

  const totalSpent = paid.reduce(
    (sum, t) => sum + Number(t.final_price ?? t.quoted_price ?? t.base_price ?? 0),
    0
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Spent</Text>
        <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
        <Text style={styles.summarySubLabel}>{paid.length} payment{paid.length !== 1 ? "s" : ""}</Text>
      </View>

      <FlatList
        data={paid}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <PaymentRow task={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="card-outline"
            title="No payments yet"
            subtitle="Your payment history will appear here once you complete a booking."
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.brandGreen,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  summaryLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  summaryValue: { fontSize: 36, color: "#fff", fontWeight: "800", marginVertical: 4 },
  summarySubLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  rowDate: { fontSize: 12, color: colors.subtext, marginTop: 2 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  rowAmount: { fontSize: 16, fontWeight: "700", color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeGreen: { backgroundColor: "#DCFCE7" },
  badgeGray: { backgroundColor: "#F3F4F6" },
  statusText: { fontSize: 11, fontWeight: "600", color: colors.subtext, textTransform: "capitalize" },
  separator: { height: spacing.sm },
});
