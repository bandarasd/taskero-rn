import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getWorkerTasks } from "../../services/taskService";
import { getWorkerPayments } from "../../services/paymentService";
import { WorkerJobCard } from "../../components/worker/WorkerJobCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

export function WorkerDashboardScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ["worker-tasks", dbUserId],
    queryFn: () => getWorkerTasks(dbUserId!),
    enabled: !!dbUserId,
  });

  const { data: payments } = useQuery({
    queryKey: ["worker-payments", dbUserId],
    queryFn: () => getWorkerPayments(dbUserId!),
    enabled: !!dbUserId,
  });

  const activeTasks = (tasks ?? []).filter((t) => t.status === "accepted" || t.status === "in_progress");
  const pendingCount = (tasks ?? []).filter((t) => t.status === "pending").length;
  const monthlyEarnings = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={tasksLoading} onRefresh={refetchTasks} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()} 👋</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
      </View>

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeTasks.length}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.brandGreen }]}>
          <Text style={[styles.statValue, { color: colors.brandGreen }]}>${monthlyEarnings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      {/* Active jobs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Jobs</Text>
        {tasksLoading ? (
          <LoadingSpinner style={{ height: 100 }} size="small" />
        ) : activeTasks.length === 0 ? (
          <Text style={styles.emptyText}>No active jobs right now.</Text>
        ) : (
          activeTasks.map((task) => (
            <WorkerJobCard
              key={task.id}
              task={task}
              onPress={() => navigation.navigate("WorkerJobDetail", { taskId: task.id })}
            />
          ))
        )}
      </View>

      {/* Pending requests */}
      {pendingCount > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending Requests
            <Text style={styles.badge}> {pendingCount}</Text>
          </Text>
          {(tasks ?? [])
            .filter((t) => t.status === "pending")
            .slice(0, 3)
            .map((task) => (
              <WorkerJobCard
                key={task.id}
                task={task}
                onPress={() => navigation.navigate("WorkerJobDetail", { taskId: task.id })}
              />
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  header: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 },
  date: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  statsRow: { flexDirection: "row", gap: 10, padding: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: colors.subtext, fontWeight: "500" },
  section: { paddingHorizontal: spacing.lg, marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 14 },
  badge: { color: colors.brandGreen },
  emptyText: { fontSize: 14, color: colors.subtext, textAlign: "center", paddingVertical: 20 },
});
