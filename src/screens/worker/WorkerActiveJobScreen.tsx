import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getTaskById, updateTaskStatus } from "../../services/taskService";
import { getUserById } from "../../services/userService";
import { createThread } from "../../services/chatService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Avatar } from "../../components/common/Avatar";
import { SwipeToConfirm } from "../../components/common/SwipeToConfirm";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type RouteProps = RouteProp<WorkerStackParamList, "WorkerActiveJob">;
type Nav = NativeStackNavigationProp<WorkerStackParamList>;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function fmtTime(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function WorkerActiveJobScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { taskId } = route.params;
  const { dbUserId } = useAuth();
  const qc = useQueryClient();

  const [elapsed, setElapsed] = useState(0);
  const [messageLoading, setMessageLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSeededElapsed = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

  const { data: customer } = useQuery({
    queryKey: ["user", task?.customer_id],
    queryFn: () => getUserById(task!.customer_id),
    enabled: !!task?.customer_id,
  });

  const startedAtRef = useRef<string | null>(null);

  const syncElapsed = (startedAt: string) => {
    const secondsElapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000
    );
    setElapsed(Math.max(0, secondsElapsed));
  };

  useEffect(() => {
    if (task?.started_at && !hasSeededElapsed.current) {
      startedAtRef.current = task.started_at;
      syncElapsed(task.started_at);
      hasSeededElapsed.current = true;
    }
  }, [task?.started_at]);

  useEffect(() => {
    // Recalculate from started_at on foreground resume so backgrounded time is included
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && startedAtRef.current) {
        syncElapsed(startedAtRef.current);
      }
    });
    intervalRef.current = setInterval(() => {
      if (startedAtRef.current) {
        syncElapsed(startedAtRef.current);
      }
    }, 1000);
    return () => {
      sub.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Pulse animation on the ring
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  if (isLoading || !task) return <LoadingSpinner />;

  const displayCustomer = customer || task.customer;
  const customerName = displayCustomer
    ? `${displayCustomer.first_name ?? ""} ${displayCustomer.last_name ?? ""}`.trim()
    : "Customer";

  const handleMessage = async () => {
    if (!task.customer_id || !dbUserId) return;
    setMessageLoading(true);
    try {
      const thread = await createThread(task.customer_id, dbUserId, taskId);
      navigation.navigate("WorkerChat", { threadId: thread.id, otherUserName: customerName, taskId });
    } catch {
      Alert.alert("Error", "Could not open conversation");
    } finally {
      setMessageLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await updateTaskStatus(taskId, "payment_pending");
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["worker-tasks"] });
      navigation.navigate("WorkerJobCompletion", { taskId });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update job status");
      setCompleting(false);
    }
  };

  const quotedAmount = task.quoted_price ?? task.base_price ?? 0;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.brandGreen, "#009E53"]}
        style={[styles.topSection, { paddingTop: insets.top }]}
      >
        {/* Nav row */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>IN PROGRESS</Text>
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={handleMessage} disabled={messageLoading}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Title + timer row */}
        <View style={styles.headerBody}>
          {/* Left: title */}
          <View style={styles.headerLeft}>
            <Text style={styles.jobTitle}>
              {task.gig_title ?? task.title ?? "Active Job"}
            </Text>
          </View>

          {/* Right: timer ring */}
          <View style={styles.ringWrapper}>
            <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.ringTrack}>
              <View style={styles.ringInner}>
                <Text style={styles.timerClock}>{fmtElapsed(elapsed)}</Text>
                <Text style={styles.timerLabel}>ELAPSED</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Customer row */}
        <View style={styles.customerCard}>
          <Avatar uri={displayCustomer?.avatar_url} name={customerName} size={46} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerMeta}>CUSTOMER</Text>
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
          <TouchableOpacity style={styles.messageBtn} onPress={handleMessage} disabled={messageLoading}>
            <Ionicons name="chatbubble-outline" size={15} color={colors.brandGreen} />
            <Text style={styles.messageBtnText}>{messageLoading ? "…" : "Message"}</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        {task.notes ? (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Ionicons name="document-text-outline" size={14} color={colors.subtext} />
              <Text style={styles.notesLabel}>JOB NOTES</Text>
            </View>
            <Text style={styles.notesText}>{task.notes}</Text>
          </View>
        ) : null}

        {/* Job details grid */}
        <View style={styles.detailsCard}>
          {task.location_address ? (
            <DetailRow icon="location-outline" label="Location" value={task.location_address} />
          ) : null}
          {quotedAmount ? (
            <DetailRow icon="cash-outline" label="Quoted" value={`Rs. ${quotedAmount.toLocaleString()}`} last={!task.scheduled_at && !task.category} />
          ) : null}
          {task.scheduled_at ? (
            <DetailRow icon="calendar-outline" label="Scheduled" value={fmtTime(task.scheduled_at) ?? ""} last={!task.category} />
          ) : null}
          {task.category ? (
            <DetailRow icon="pricetag-outline" label="Category" value={task.category} last />
          ) : null}
        </View>
      </View>

      {/* ── Bottom bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <SwipeToConfirm
          label="Swipe to Complete Job"
          onConfirm={handleComplete}
          loading={completing}
          variant="green"
        />
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={15} color={colors.brandGreen} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, flexDirection: "column" },

  // ── Header ──
  topSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  navBtn: { width: 40, height: 40, justifyContent: "center" },
  statusPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.6,
  },

  headerBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  headerLeft: {
    flex: 1,
    gap: 10,
    paddingRight: 4,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 26,
  },
  ringWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  ringTrack: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerClock: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2,
    marginTop: 3,
  },

  // ── Content ──
  content: {
    flex: 1,
    paddingTop: 12,
    gap: 8,
  },

  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  customerInfo: { flex: 1, marginLeft: 14 },
  customerMeta: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  customerName: { fontSize: 16, fontWeight: "700", color: colors.text },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 5,
  },
  messageBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brandGreen,
  },

  detailsCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.brandGreenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: colors.subtext,
    fontWeight: "500",
    width: 74,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textAlign: "right",
  },

  notesCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 21 },

  // ── Bottom bar ──
  bottomBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
    gap: 10,
  },
});
