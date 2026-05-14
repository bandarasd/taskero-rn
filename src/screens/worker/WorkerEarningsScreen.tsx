import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getWorkerPayments } from "../../services/paymentService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";

export function WorkerEarningsScreen() {
  const { dbUserId } = useAuth();

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ["worker-payments", dbUserId],
    queryFn: () => getWorkerPayments(dbUserId!),
    enabled: !!dbUserId,
  });

  const total = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const thisMonth = (payments ?? [])
    .filter((p) => {
      const d = p.created_at ? new Date(p.created_at) : null;
      if (!d) return false;
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Hero Header */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Earnings</Text>

        <View style={styles.summaryCard}>
          <View style={styles.mainStat}>
            <Text style={styles.summaryLabel}>Total Earned</Text>
            <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.subStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>THIS MONTH</Text>
              <Text style={styles.statValue}>${thisMonth.toFixed(2)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>PAYOUTS</Text>
              <Text style={styles.statValue}>{payments?.length || 0}</Text>
            </View>
          </View>
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.brandGreen}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Payment History</Text>
              <Pressable style={styles.filterBtn}>
                <Text style={styles.filterText}>All Time</Text>
                <Ionicons name="chevron-down" size={14} color={colors.subtext} />
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="💰"
              title="No payments yet"
              message="Complete jobs to start earning money on Taskero."
            />
          }
          renderItem={({ item: p }) => (
            <View style={styles.paymentRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet-outline" size={20} color={colors.brandGreen} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTask}>
                  Job #{p.task_id.slice(0, 8).toUpperCase()}
                </Text>
                <Text style={styles.paymentDate}>
                  {p.created_at
                    ? new Date(p.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""}
                </Text>
              </View>
              <Text style={styles.paymentAmount}>+${p.amount?.toFixed(2)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.brandGreen,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: "#111",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  mainStat: {
    alignItems: "center",
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  subStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.brandGreen,
  },
  list: { padding: spacing.lg, paddingBottom: 32 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtext,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brandGreen + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  paymentTask: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: "500",
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandGreen,
  },
});

