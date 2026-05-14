import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
  active: ["accepted", "in_progress"],
  completed: ["completed", "canceled", "declined"],
};

export function WorkerJobsScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>("pending");

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ["worker-tasks", dbUserId],
    queryFn: () => getWorkerTasks(dbUserId!),
    enabled: !!dbUserId,
  });

  const filtered = (tasks ?? []).filter((t) => TAB_FILTERS[tab].includes(t.status));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Jobs</Text>
        <View style={styles.tabs}>
          {(["pending", "active", "completed"] as Tab[]).map((t) => {
            const count = (tasks ?? []).filter((task) => TAB_FILTERS[t].includes(task.status)).length;
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
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
          {filtered.length === 0 ? (
            <EmptyState icon="📋" title={`No ${tab} jobs`} />
          ) : (
            filtered.map((task) => (
              <WorkerJobCard
                key={task.id}
                task={task}
                onPress={() => navigation.navigate("WorkerJobDetail", { taskId: task.id })}
              />
            ))
          )}
        </ScrollView>
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
