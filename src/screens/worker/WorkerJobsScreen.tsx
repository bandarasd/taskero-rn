import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { getWorkerTasks } from "../../services/taskService";
import { WorkerJobCard } from "../../components/worker/WorkerJobCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type Nav = NativeStackNavigationProp<WorkerStackParamList>;
type Tab = "pending" | "active" | "completed";

const TAB_FILTERS: Record<Tab, string[]> = {
  pending: ["pending", "quoted"],
  active: ["accepted", "in_progress", "payment_pending"],
  completed: ["completed", "canceled", "declined"],
};

export function WorkerJobsScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const route = useRoute<NativeStackScreenProps<WorkerStackParamList, "WorkerJobs">["route"]>();
  const [tab, setTab] = useState<Tab>((route.params as any)?.initialTab ?? "pending");

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["worker-tasks", dbUserId],
    queryFn: ({ pageParam = 1 }) => getWorkerTasks(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });

  const tasks = data?.pages.flatMap((p) => p.data) ?? [];
  const filtered = tasks.filter((t) => TAB_FILTERS[tab].includes(t.status));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Jobs</Text>
        <View style={styles.tabs}>
          {(["pending", "active", "completed"] as Tab[]).map((t) => {
            const count = tasks.filter((task) => TAB_FILTERS[t].includes(task.status)).length;
            return (
              <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {count > 0 ? ` (${count})` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => { qc.removeQueries({ queryKey: ["worker-tasks", dbUserId] }); refetch(); }}
            />
          }
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brandGreen} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={<EmptyState icon="📋" title={`No ${tab} jobs`} />}
          renderItem={({ item: task }) => (
            <WorkerJobCard
              task={task}
              onPress={() => {
                if (task.status === "in_progress") {
                  navigation.navigate("WorkerActiveJob", { taskId: task.id });
                } else if (task.status === "payment_pending") {
                  navigation.navigate("WorkerJobCompletion", { taskId: task.id });
                } else {
                  navigation.navigate("WorkerJobDetail", { taskId: task.id });
                }
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heading: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 14 },
  tabs: { flexDirection: "row", gap: 6 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  tabActive: { backgroundColor: colors.brandGreen },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.subtext },
  tabTextActive: { color: "#fff" },
  list: { padding: spacing.lg, paddingBottom: 32 },
});
