import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { WorkerTabParamList } from "../../navigation/tabs/WorkerTabs";
import { Ionicons } from "@expo/vector-icons";
import { getWorkerTasks } from "../../services/taskService";
import { getWorkerPayments } from "../../services/paymentService";
import { getWorkerGigs } from "../../services/gigService";
import { getNotifications, markNotificationRead } from "../../services/notificationService";
import { getTaskerReviews } from "../../services/reviewService";
import { getUserById } from "../../services/userService";
import { WorkerJobCard } from "../../components/worker/WorkerJobCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { APINotification, APITask, Gig } from "../../types";
import { useCategoryByName } from "../../hooks/useCategories";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type Nav = NativeStackNavigationProp<WorkerStackParamList>;
type TabNav = BottomTabNavigationProp<WorkerTabParamList>;

// ─── Helpers ────────────────────────────────────────────────────────────────

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(1)}M`;
  return `Rs. ${Math.round(n).toLocaleString()}`;
}

// ─── Divider ────────────────────────────────────────────────────────────────

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Pill badge ─────────────────────────────────────────────────────────────

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

// ─── Row tile used in lists ──────────────────────────────────────────────────

function RowTile({
  left,
  title,
  subtitle,
  right,
  onPress,
}: {
  left: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.rowTile} onPress={onPress} android_ripple={{ color: "#f0f0f0" }}>
      <View style={styles.rowTileLeft}>{left}</View>
      <View style={styles.rowTileBody}>
        <Text style={styles.rowTileTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.rowTileSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />}
    </Pressable>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────

function SectionHead({
  title,
  action,
  onAction,
  badge,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  badge?: number;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={styles.sectionHeadTitle}>{title}</Text>
        {badge != null && badge > 0 && <Badge count={badge} />}
      </View>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionHeadAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Gig icon bubble ────────────────────────────────────────────────────────

function GigBubble({ gig }: { gig: Gig }) {
  const { data: cat } = useCategoryByName(gig.category);
  return (
    <View style={styles.gigBubble}>
      <Text style={{ fontSize: 20 }}>{cat?.icon ?? "✨"}</Text>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export function WorkerDashboardScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();
  const tabNavigation = useNavigation<TabNav>();
  const qc = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: workerProfile } = useQuery({
    queryKey: ["user", dbUserId],
    queryFn: () => getUserById(dbUserId!),
    enabled: !!dbUserId,
  });

  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useInfiniteQuery({
    queryKey: ["worker-tasks", dbUserId],
    queryFn: ({ pageParam = 1 }) => getWorkerTasks(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });
  const tasks = tasksData?.pages.flatMap((p) => p.data) ?? [];

  const { data: gigsData, isLoading: gigsLoading, refetch: refetchGigs } = useInfiniteQuery({
    queryKey: ["worker-gigs", dbUserId],
    queryFn: ({ pageParam = 1 }) => getWorkerGigs(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });
  const gigs = gigsData?.pages.flatMap((p) => p.data) ?? [];

  const { data: paymentsData } = useInfiniteQuery({
    queryKey: ["worker-payments", dbUserId],
    queryFn: ({ pageParam = 1 }) => getWorkerPayments(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });
  const payments = paymentsData?.pages.flatMap((p) => p.data) ?? [];

  const { data: reviewsData } = useInfiniteQuery({
    queryKey: ["worker-reviews", dbUserId],
    queryFn: ({ pageParam = 1 }) => getTaskerReviews(dbUserId!, pageParam, 10),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });
  const reviews = reviewsData?.pages.flatMap((p) => p.data) ?? [];

  const { data: notifData } = useInfiniteQuery({
    queryKey: ["notifications", dbUserId],
    queryFn: ({ pageParam = 1 }) => getNotifications(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });
  const notifications = notifData?.pages.flatMap((p) => p.data) ?? [];

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ─── Analytics ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const allTasks = tasks;
    const allPayments = payments;
    const allReviews = reviews;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const activeTasks = allTasks.filter(
      (t) => t.status === "accepted" || t.status === "in_progress"
    );
    const pendingTasks = allTasks.filter((t) => t.status === "pending");
    const completedTasks = allTasks.filter((t) => t.status === "completed");

    const monthlyEarnings = completedTasks
      .filter((t) => {
        const d = t.completed_at ? new Date(t.completed_at) : null;
        return d && d >= startOfMonth;
      })
      .reduce((s, t) => s + (Number(t.final_price ?? t.quoted_price) || 0), 0);

    const weeklyEarnings = completedTasks
      .filter((t) => {
        const d = t.completed_at ? new Date(t.completed_at) : null;
        return d && d >= startOfWeek;
      })
      .reduce((s, t) => s + (Number(t.final_price ?? t.quoted_price) || 0), 0);

    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
        : 0;

    const completionRate =
      allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0;

    const nextJob = activeTasks
      .filter((t) => t.scheduled_at)
      .sort(
        (a, b) =>
          new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
      )[0] ?? null;

    return {
      activeTasks,
      pendingTasks,
      completedTasks,
      monthlyEarnings,
      weeklyEarnings,
      avgRating,
      reviewCount: allReviews.length,
      completionRate,
      nextJob,
    };
  }, [tasks, payments, reviews]);

  const isRefreshing = tasksLoading || gigsLoading;
  const handleRefresh = () => { refetchTasks(); refetchGigs(); };

  const handleReadNotification = async (n: APINotification) => {
    try {
      await markNotificationRead(n.id);
      qc.invalidateQueries({ queryKey: ["notifications", dbUserId] });
    } catch {}
    setShowNotifications(false);
    const taskId = (n.data as { taskId?: string } | null)?.taskId;
    if (taskId) navigation.navigate("WorkerJobDetail", { taskId });
  };

  const firstName = workerProfile?.first_name ?? "";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandGreen}
          />
        }
      >
        {/* ════════════════════════════════════════
            DARK HERO — earnings + greeting
        ════════════════════════════════════════ */}
        <View style={styles.hero}>
          {/* Top bar */}
          <View style={styles.heroTopBar}>
            <View>
              <Text style={styles.heroGreeting}>
                {greetingWord()}{firstName ? `, ${firstName}` : ""}
              </Text>
              <Text style={styles.heroDate}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.heroIconBtn}
                onPress={() => setShowNotifications(true)}
              >
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {unreadCount > 0 && <View style={styles.heroBadgeDot} />}
              </Pressable>
              {workerProfile?.avatar_url ? (
                <Image source={{ uri: workerProfile.avatar_url }} style={styles.heroAvatar} />
              ) : (
                <View style={styles.heroAvatarPlaceholder}>
                  <Text style={styles.heroAvatarInitial}>
                    {firstName ? firstName.charAt(0).toUpperCase() : "T"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Big earnings number */}
          <View style={styles.heroEarnings}>
            <Text style={styles.heroEarningsLabel}>THIS MONTH</Text>
            <Text style={styles.heroEarningsValue}>
              {formatMoney(stats.monthlyEarnings)}
            </Text>
            <Text style={styles.heroEarningsSub}>
              {formatMoney(stats.weeklyEarnings)} this week
            </Text>
          </View>

          {/* 3 mini stats inside hero */}
          <View style={styles.heroStats}>
            <Pressable style={styles.heroStat} onPress={() => tabNavigation.navigate("JobsTab", { screen: "WorkerJobs", params: { initialTab: "active" } } as any)}>
              <Text style={styles.heroStatValue}>{stats.activeTasks.length}</Text>
              <Text style={styles.heroStatLabel}>Active</Text>
            </Pressable>
            <View style={styles.heroStatDivider} />
            <Pressable style={styles.heroStat} onPress={() => tabNavigation.navigate("JobsTab", { screen: "WorkerJobs", params: { initialTab: "pending" } } as any)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[styles.heroStatValue, stats.pendingTasks.length > 0 && { color: colors.brandGreen }]}>
                  {stats.pendingTasks.length}
                </Text>
                {stats.pendingTasks.length > 0 && (
                  <View style={styles.heroStatDot} />
                )}
              </View>
              <Text style={styles.heroStatLabel}>Requests</Text>
            </Pressable>
            <View style={styles.heroStatDivider} />
            <Pressable style={styles.heroStat} onPress={() => navigation.navigate("WorkerReviews")}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {stats.avgRating > 0 ? (
                  <>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.heroStatValue}>{stats.avgRating.toFixed(1)}</Text>
                  </>
                ) : (
                  <Text style={styles.heroStatValue}>—</Text>
                )}
              </View>
              <Text style={styles.heroStatLabel}>Rating</Text>
            </Pressable>
          </View>
        </View>

        {/* ════════════════════════════════════════
            NEXT UPCOMING JOB — green accent bar
        ════════════════════════════════════════ */}
        {stats.nextJob && (() => {
          const job = stats.nextJob!;
          const d = job.scheduled_at ? new Date(job.scheduled_at) : null;
          const timeStr = d?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          const dateStr = d?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          return (
            <Pressable
              style={styles.nextJobBar}
              onPress={() => navigation.navigate("WorkerJobDetail", { taskId: job.id })}
            >
              <View style={styles.nextJobPulse} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nextJobEyebrow}>UPCOMING JOB</Text>
                <Text style={styles.nextJobTitle} numberOfLines={1}>
                  {job.title ?? "Booking"}
                </Text>
              </View>
              {d && (
                <View style={styles.nextJobTime}>
                  <Text style={styles.nextJobTimeDate}>{dateStr}</Text>
                  <Text style={styles.nextJobTimeClock}>{timeStr}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.brandGreen} style={{ marginLeft: 8 }} />
            </Pressable>
          );
        })()}

        {/* ════════════════════════════════════════
            NEW REQUESTS — high priority
        ════════════════════════════════════════ */}
        {stats.pendingTasks.length > 0 && (
          <View style={styles.card}>
            <SectionHead
              title="New Requests"
              badge={stats.pendingTasks.length}
              action="See all"
              onAction={() => tabNavigation.navigate("JobsTab", { screen: "WorkerJobs", params: { initialTab: "pending" } } as any)}
            />
            <Divider />
            {stats.pendingTasks.slice(0, 3).map((task, i, arr) => (
              <React.Fragment key={task.id}>
                <WorkerJobCard
                  task={task}
                  onPress={() => navigation.navigate("WorkerJobDetail", { taskId: task.id })}
                />
                {i < arr.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* ════════════════════════════════════════
            ACTIVE JOBS
        ════════════════════════════════════════ */}
        <View style={styles.card}>
          <SectionHead
            title="Active Jobs"
            action={stats.activeTasks.length > 0 ? "See all" : undefined}
            onAction={() => tabNavigation.navigate("JobsTab", { screen: "WorkerJobs", params: { initialTab: "active" } } as any)}
          />
          <Divider />
          {tasksLoading ? (
            <LoadingSpinner style={{ height: 80 }} size="small" />
          ) : stats.activeTasks.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No active jobs right now</Text>
            </View>
          ) : (
            stats.activeTasks.slice(0, 3).map((task, i, arr) => (
              <React.Fragment key={task.id}>
                <WorkerJobCard
                  task={task}
                  onPress={() =>
                    navigation.navigate(
                      task.status === "in_progress" ? "WorkerActiveJob" : "WorkerJobDetail",
                      { taskId: task.id }
                    )
                  }
                />
                {i < arr.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </View>

        {/* ════════════════════════════════════════
            MY SERVICES
        ════════════════════════════════════════ */}
        <View style={styles.card}>
          <SectionHead
            title="My Services"
            action={gigs.length > 0 ? "Manage" : undefined}
            onAction={() => navigation.navigate("WorkerServices")}
          />
          <Divider />
          {gigsLoading ? (
            <LoadingSpinner style={{ height: 80 }} size="small" />
          ) : gigs.length === 0 ? (
            <Pressable
              style={styles.addServiceRow}
              onPress={() => navigation.navigate("AddEditService", { gigId: undefined })}
            >
              <View style={styles.addServiceIconWrap}>
                <Ionicons name="add" size={20} color={colors.brandGreen} />
              </View>
              <Text style={styles.addServiceText}>Post your first service</Text>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
            </Pressable>
          ) : (
            gigs.slice(0, 4).map((gig, i, arr) => {
              const isActive = !gig.status || gig.status === "active";
              return (
                <React.Fragment key={gig.id}>
                  <RowTile
                    left={<GigBubble gig={gig} />}
                    title={gig.title}
                    subtitle={`From Rs. ${gig.base_price}`}
                    right={
                      <View style={[styles.statusPill, isActive ? styles.pillOn : styles.pillOff]}>
                        <Text style={[styles.pillText, isActive ? styles.pillTextOn : styles.pillTextOff]}>
                          {isActive ? "Active" : "Paused"}
                        </Text>
                      </View>
                    }
                    onPress={() => navigation.navigate("WorkerServices")}
                  />
                  {i < arr.length - 1 && <Divider />}
                </React.Fragment>
              );
            })
          )}
        </View>

        {/* ════════════════════════════════════════
            PERFORMANCE STATS
        ════════════════════════════════════════ */}
        <View style={styles.card}>
          <SectionHead title="Performance" />
          <Divider />
          <RowTile
            left={<View style={[styles.perfIcon, { backgroundColor: "#FFF7ED" }]}><Ionicons name="checkmark-circle-outline" size={18} color="#F97316" /></View>}
            title="Completed Jobs"
            subtitle="All time"
            right={<Text style={styles.perfValue}>{stats.completedTasks.length}</Text>}
          />
          <Divider />
          <RowTile
            left={<View style={[styles.perfIcon, { backgroundColor: "#ECFDF5" }]}><Ionicons name="trending-up-outline" size={18} color={colors.brandGreen} /></View>}
            title="Completion Rate"
            subtitle="Accepted vs completed"
            right={<Text style={styles.perfValue}>{stats.completionRate}%</Text>}
          />
          {stats.avgRating > 0 && (
            <>
              <Divider />
              <RowTile
                left={<View style={[styles.perfIcon, { backgroundColor: "#FFFBEB" }]}><Ionicons name="star-outline" size={18} color="#F59E0B" /></View>}
                title="Average Rating"
                subtitle={`${stats.reviewCount} review${stats.reviewCount !== 1 ? "s" : ""}`}
                right={
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.perfValue}>{stats.avgRating.toFixed(1)}</Text>
                  </View>
                }
                onPress={() => navigation.navigate("WorkerReviews")}
              />
            </>
          )}
          <Divider />
          <RowTile
            left={<View style={[styles.perfIcon, { backgroundColor: "#EFF6FF" }]}><Ionicons name="wallet-outline" size={18} color="#3B82F6" /></View>}
            title="This Month"
            subtitle="Earnings"
            right={<Text style={[styles.perfValue, { color: colors.brandGreen }]}>{formatMoney(stats.monthlyEarnings)}</Text>}
            onPress={() => navigation.navigate("WorkerEarnings")}
          />
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════
          NOTIFICATIONS SHEET
      ════════════════════════════════════════ */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowNotifications(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <Pressable
                onPress={() => {
                  setShowNotifications(false);
                  navigation.navigate("WorkerNotifications");
                }}
              >
                <Text style={styles.sheetAction}>See all</Text>
              </Pressable>
            </View>
            <FlatList
              data={notifications}
              keyExtractor={(n) => n.id}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <View style={{ marginTop: 48 }}>
                  <EmptyState icon="🔔" title="No notifications yet" />
                </View>
              }
              renderItem={({ item: n }) => (
                <Pressable
                  onPress={() => handleReadNotification(n)}
                  style={[styles.notifItem, !n.is_read && styles.notifItemUnread]}
                >
                  <View style={[styles.notifIcon, n.is_read ? styles.notifIconRead : styles.notifIconUnread]}>
                    <Ionicons
                      name={n.is_read ? "notifications-outline" : "notifications"}
                      size={18}
                      color={n.is_read ? "#9CA3AF" : colors.brandGreen}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text style={[styles.notifTitle, !n.is_read && { color: colors.text }]} numberOfLines={1}>
                        {n.title}
                      </Text>
                      <Text style={styles.notifTime}>
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                      </Text>
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                  </View>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F2F7" },

  divider: { height: 1, backgroundColor: "#F2F2F7" },

  // ── Hero (dark) ──
  hero: {
    backgroundColor: "#111111",
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === "ios" ? 60 : (StatusBar.currentHeight ?? 24) + 16,
    paddingBottom: 28,
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  heroGreeting: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.3 },
  heroDate: { fontSize: 13, color: "#8E8E93", marginTop: 2 },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadgeDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#2C2C2E",
  },
  heroAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarInitial: { color: "#fff", fontWeight: "700", fontSize: 15 },

  heroEarnings: { marginBottom: 28 },
  heroEarningsLabel: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroEarningsValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -2,
    lineHeight: 52,
  },
  heroEarningsSub: { fontSize: 14, color: "#8E8E93", marginTop: 6, fontWeight: "500" },

  heroStats: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    paddingVertical: 16,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatDivider: { width: 1, backgroundColor: "#2C2C2E" },
  heroStatValue: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  heroStatLabel: { fontSize: 11, color: "#8E8E93", fontWeight: "500", marginTop: 3 },
  heroStatDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brandGreen,
    marginBottom: 2,
  },

  // ── Next job bar ──
  nextJobBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandGreen,
  },
  nextJobPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandGreen,
    marginRight: 12,
  },
  nextJobEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.brandGreen,
    letterSpacing: 1,
  },
  nextJobTitle: { fontSize: 14, fontWeight: "600", color: "#111", marginTop: 2 },
  nextJobTime: { alignItems: "flex-end" },
  nextJobTimeDate: { fontSize: 11, color: "#8E8E93", fontWeight: "500" },
  nextJobTimeClock: { fontSize: 13, fontWeight: "700", color: "#111", marginTop: 1 },

  // ── White cards ──
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
  },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeadTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  sectionHeadAction: { fontSize: 14, color: colors.brandGreen, fontWeight: "600" },

  badge: {
    backgroundColor: colors.warning,
    borderRadius: 99,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // ── Row tile ──
  rowTile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  rowTileLeft: {},
  rowTileBody: { flex: 1 },
  rowTileTitle: { fontSize: 14, fontWeight: "600", color: "#111" },
  rowTileSubtitle: { fontSize: 12, color: "#8E8E93", marginTop: 1 },

  // ── Gig icon ──
  gigBubble: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Status pills ──
  statusPill: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillOn: { backgroundColor: "#ECFDF5" },
  pillOff: { backgroundColor: "#F3F4F6" },
  pillText: { fontSize: 12, fontWeight: "600" },
  pillTextOn: { color: colors.success },
  pillTextOff: { color: "#8E8E93" },

  // ── Add service row ──
  addServiceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  addServiceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.brandGreenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addServiceText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.brandGreen },

  // ── Performance icons ──
  perfIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  perfValue: { fontSize: 16, fontWeight: "700", color: "#111" },

  // ── Empty row ──
  emptyRow: { paddingHorizontal: 16, paddingVertical: 20, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#8E8E93" },

  // ── Notification modal ──
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    height: "70%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  sheetAction: { fontSize: 14, color: colors.brandGreen, fontWeight: "600" },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
  },
  notifItemUnread: {
    backgroundColor: "#F0FDF4",
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  notifIconRead: { backgroundColor: "#F3F4F6" },
  notifIconUnread: { backgroundColor: "#DCFCE7" },
  notifTitle: { fontSize: 14, fontWeight: "600", color: "#9CA3AF", flex: 1 },
  notifTime: { fontSize: 11, color: "#9CA3AF" },
  notifBody: { fontSize: 13, color: "#9CA3AF", lineHeight: 18 },
});
