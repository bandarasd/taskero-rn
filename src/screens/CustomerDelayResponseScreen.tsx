import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getTaskById, respondToDelay } from "../services/taskService";
import { getUserById } from "../services/userService";
import { Avatar } from "../components/common/Avatar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type RouteProps = RouteProp<CustomerStackParamList, "CustomerDelayResponse">;
type Nav = NativeStackNavigationProp<CustomerStackParamList>;

function fmtTime(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function CustomerDelayResponseScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { taskId } = route.params;
  const qc = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

  const { data: tasker } = useQuery({
    queryKey: ["user", task?.tasker_id],
    queryFn: () => getUserById(task!.tasker_id!),
    enabled: !!task?.tasker_id,
  });

  if (isLoading || !task) return <LoadingSpinner />;

  const displayTasker = tasker || task.tasker;
  const taskerName = displayTasker
    ? `${displayTasker.first_name ?? ""} ${displayTasker.last_name ?? ""}`.trim()
    : "Your Tasker";

  const originalTime = fmtTime(task.scheduled_at);
  const newEta = fmtTime(task.tasker_new_eta);

  const handleAction = async (action: 'wait' | 'cancel' | 'reschedule') => {
    if (action === 'cancel') {
      Alert.alert(
        "Cancel Booking",
        "Are you sure you want to cancel? You'll receive a full refund.",
        [
          { text: "Keep Booking", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: () => doAction('cancel'),
          },
        ]
      );
      return;
    }
    doAction(action);
  };

  const doAction = async (action: 'wait' | 'cancel' | 'reschedule') => {
    setLoading(action);
    try {
      await respondToDelay(taskId, action);
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks", "customer"] });

      if (action === 'cancel') {
        Alert.alert("Cancelled", "Your booking has been cancelled and a full refund is on the way.", [
          { text: "OK", onPress: () => navigation.navigate("Bookings") },
        ]);
      } else if (action === 'wait') {
        Alert.alert("Got it", `${taskerName} will be notified that you're waiting.`, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        navigation.goBack();
      }
    } catch {
      Alert.alert("Error", "Could not process your response. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const alreadyResponded = !!task.delay_response;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.warningIcon}>
          <Ionicons name="warning" size={32} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Tasker Running Late</Text>
        <Text style={styles.headerSub}>
          {taskerName} is finishing a previous job and will be delayed.
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* Tasker info */}
        <View style={styles.taskerCard}>
          <Avatar uri={displayTasker?.avatar_url} name={taskerName} size={52} />
          <View style={styles.taskerInfo}>
            <Text style={styles.taskerMeta}>YOUR TASKER</Text>
            <Text style={styles.taskerName}>{taskerName}</Text>
          </View>
        </View>

        {/* Time info */}
        <View style={styles.timeCard}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={18} color={colors.subtext} />
            <Text style={styles.timeLabel}>Original time:</Text>
            <Text style={styles.timeValue}>{originalTime ?? "—"}</Text>
          </View>
          {newEta && (
            <View style={styles.timeRow}>
              <Ionicons name="alarm-outline" size={18} color={colors.warning} />
              <Text style={styles.timeLabel}>New estimate:</Text>
              <Text style={[styles.timeValue, { color: colors.warning }]}>{newEta}</Text>
            </View>
          )}
        </View>

        {/* Action prompt */}
        <Text style={styles.prompt}>What would you like to do?</Text>

        {alreadyResponded ? (
          <View style={styles.respondedBanner}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.brandGreen} />
            <Text style={styles.respondedText}>
              You already responded:{" "}
              <Text style={{ fontWeight: "700" }}>{task.delay_response}</Text>
            </Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <ActionButton
              icon="time-outline"
              label="Wait for Tasker"
              description="Keep your booking, tasker will come when done."
              color={colors.brandGreen}
              loading={loading === 'wait'}
              onPress={() => handleAction('wait')}
            />
            <ActionButton
              icon="close-circle-outline"
              label="Cancel for Full Refund"
              description="Cancel this booking and receive a full refund."
              color="#EF4444"
              loading={loading === 'cancel'}
              onPress={() => handleAction('cancel')}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function ActionButton({
  icon, label, description, color, loading, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  color: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { borderColor: color }]} onPress={onPress} disabled={loading}>
      <View style={[styles.actionIcon, { backgroundColor: color + "18" }]}>
        {loading
          ? <ActivityIndicator size="small" color={color} />
          : <Ionicons name={icon} size={22} color={color} />}
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
        <Text style={styles.actionDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: 28,
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    left: spacing.lg,
    top: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  warningIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 20,
  },

  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
  },

  taskerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  taskerInfo: { marginLeft: 14 },
  taskerMeta: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  taskerName: { fontSize: 17, fontWeight: "700", color: colors.text },

  timeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeLabel: { fontSize: 14, color: colors.subtext, flex: 1 },
  timeValue: { fontSize: 15, fontWeight: "700", color: colors.text },

  prompt: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
  },

  actions: { gap: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  actionDesc: { fontSize: 12, color: colors.subtext, lineHeight: 16 },

  respondedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderRadius: radius.md,
    padding: 16,
  },
  respondedText: { fontSize: 14, color: colors.text },
});
