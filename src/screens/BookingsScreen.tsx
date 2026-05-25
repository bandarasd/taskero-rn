import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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
import { Animated } from "react-native";

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

const ACTIVE_STATUSES = ["pending", "quoted", "accepted", "in_progress", "payment_pending"];
const PAST_STATUSES = ["completed", "canceled", "declined"];

export function BookingsScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"active" | "past">("active");
  const [underlineAnim] = useState(new Animated.Value(0));

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["tasks", "customer", dbUserId],
    queryFn: ({ pageParam = 1 }) => getCustomerTasks(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });

  const tasks = data?.pages.flatMap((p) => p.data) ?? [];

  const activeCount = tasks.filter((t) => ACTIVE_STATUSES.includes(t.status)).length;

  const filtered = tasks.filter((t) =>
    tab === "active" ? ACTIVE_STATUSES.includes(t.status) : PAST_STATUSES.includes(t.status)
  );

  const handleTabChange = (newTab: "active" | "past") => {
    setTab(newTab);
    Animated.spring(underlineAnim, {
      toValue: newTab === "active" ? 0 : 1,
      useNativeDriver: false, // width/left properties don't support native driver
      tension: 50,
      friction: 8,
    }).start();
  };

  const indicatorTranslate = underlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Bookings</Text>
        <Text style={styles.subheading}>{activeCount} active</Text>

        <View style={styles.tabContainer}>
          <View style={styles.tabRow}>
            {(["active", "past"] as const).map((t) => (
              <Pressable key={t} style={styles.tab} onPress={() => handleTabChange(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === "active" ? "Active" : "Past"}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.indicatorTrack}>
            <Animated.View
              style={[
                styles.indicator,
                {
                  left: indicatorTranslate,
                },
              ]}
            />
          </View>
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
              onRefresh={() => { qc.removeQueries({ queryKey: ["tasks", "customer", dbUserId] }); refetch(); }}
            />
          }
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brandGreen} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon={tab === "active" ? "📋" : "🗂️"}
              title={tab === "active" ? "No active bookings" : "No past bookings"}
              message={
                tab === "active"
                  ? "When you book a service, it'll show up here."
                  : "Completed and cancelled jobs will appear here."
              }
            />
          }
          renderItem={({ item: task }) => (
            <BookingCard
              task={task}
              onPress={() => navigation.navigate("AppointmentDetail", { taskId: task.id })}
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
    paddingTop: 64,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  heading: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 4 },
  subheading: { fontSize: 13, color: colors.subtext, marginBottom: 20 },
  tabContainer: {
    marginTop: 8,
  },
  tabRow: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.subtext,
  },
  tabTextActive: {
    color: colors.text,
  },
  indicatorTrack: {
    height: 1,
    backgroundColor: "#F3F4F6",
    width: "100%",
    position: "relative",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 2.5,
    width: "50%",
    backgroundColor: colors.brandGreen,
    borderRadius: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
});
