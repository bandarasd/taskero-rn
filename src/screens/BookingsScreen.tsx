import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getCustomerTasks } from "../services/taskService";
import { BookingCard } from "../components/bookings/BookingCard";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useAuth } from "../store/authStore";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

const ACTIVE_STATUSES = ["pending", "quoted", "accepted", "in_progress"];
const PAST_STATUSES = ["completed", "canceled", "declined"];

export function BookingsScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<"active" | "past">("active");

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ["tasks", "customer", dbUserId],
    queryFn: () => getCustomerTasks(dbUserId!),
    enabled: !!dbUserId,
  });

  const filtered = (tasks ?? []).filter((t) =>
    tab === "active" ? ACTIVE_STATUSES.includes(t.status) : PAST_STATUSES.includes(t.status)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Bookings</Text>
        <View style={styles.tabs}>
          {(["active", "past"] as const).map((t) => (
            <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "active" ? "Active" : "Past"}
              </Text>
            </Pressable>
          ))}
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
            <EmptyState
              icon={tab === "active" ? "📅" : "🗂️"}
              title={tab === "active" ? "No active bookings" : "No past bookings"}
              message={tab === "active" ? "Book a service to get started." : "Your completed jobs will appear here."}
            />
          ) : (
            filtered.map((task) => (
              <BookingCard
                key={task.id}
                task={task}
                onPress={() => navigation.navigate("AppointmentDetail", { taskId: task.id })}
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
  heading: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 16 },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: radius.full },
  tabActive: { backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.subtext },
  tabTextActive: { color: colors.text },
  list: { padding: spacing.lg, paddingBottom: 32 },
});
