import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isSameDay } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../store/authStore";
import { getWorkerTasks } from "../../services/taskService";
import { getAvailableSlots } from "../../services/scheduleService";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";
import type { APITask, TimePreference } from "../../types";

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

const SLOTS: { key: TimePreference; label: string; sub: string }[] = [
  { key: "morning",   label: "Morning",   sub: "8 AM – 12 PM" },
  { key: "afternoon", label: "Afternoon", sub: "12 PM – 5 PM" },
  { key: "evening",   label: "Evening",   sub: "5 PM – 8 PM" },
];

type SlotStatus = "booked" | "pending" | "available" | "unavailable";

function slotColor(status: SlotStatus) {
  switch (status) {
    case "booked":     return "#EF4444"; // red
    case "pending":    return "#F59E0B"; // yellow
    case "available":  return "#10B981"; // green
    case "unavailable": return colors.sectionHeader;
  }
}

function slotTextColor(status: SlotStatus) {
  return status === "unavailable" ? colors.placeholder : "#fff";
}

export function WorkerCalendarScreen() {
  const navigation = useNavigation<Nav>();
  const { dbUserId } = useAuth();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  const selectedDateStr = format(selectedDay, "yyyy-MM-dd");

  const { data: tasksData } = useQuery({
    queryKey: ["worker-tasks-all", dbUserId],
    queryFn: () => getWorkerTasks(dbUserId!, 1, 50),
    enabled: !!dbUserId,
  });

  const { data: availData } = useQuery({
    queryKey: ["avail-prefs", dbUserId, selectedDateStr],
    queryFn: () => getAvailableSlots(dbUserId!, selectedDateStr),
    enabled: !!dbUserId,
  });

  const tasks: APITask[] = tasksData?.data ?? [];

  function safeDate(val?: string | null): Date | null {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  // Tasks on the selected day
  const dayTasks = tasks.filter(t => {
    const d = safeDate(t.scheduled_at);
    return d ? isSameDay(d, selectedDay) : false;
  });

  function getSlotStatus(slot: TimePreference): SlotStatus {
    const slotTasks = dayTasks.filter(t => t.time_preference === slot);
    if (slotTasks.some(t => ["accepted", "in_progress", "completed"].includes(t.status ?? ""))) return "booked";
    if (slotTasks.some(t => t.status === "pending")) return "pending";
    if (availData) {
      if (!availData.available) return "unavailable";
      if (!availData[slot]) return "unavailable";
      return "available";
    }
    return "available";
  }

  function getSlotTask(slot: TimePreference): APITask | undefined {
    return dayTasks.find(t => t.time_preference === slot);
  }

  // Badge dot color per day (worst status shown)
  function dayBadge(day: Date): string | null {
    const dt = tasks.filter(t => {
      const d = safeDate(t.scheduled_at);
      return d ? isSameDay(d, day) : false;
    });
    if (dt.some(t => ["accepted", "in_progress"].includes(t.status ?? ""))) return "#EF4444";
    if (dt.some(t => t.status === "pending")) return "#F59E0B";
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity onPress={() => navigation.navigate("WorkerSchedule")} style={styles.availabilityBtn}>
          <Ionicons name="settings-outline" size={18} color={colors.brandGreen} />
          <Text style={styles.availabilityBtnText}>Availability</Text>
        </TouchableOpacity>
      </View>

      {/* 7-day horizontal strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip} contentContainerStyle={styles.dayStripContent}>
        {days.map((day) => {
          const selected = isSameDay(day, selectedDay);
          const badge = dayBadge(day);
          return (
            <Pressable
              key={day.toISOString()}
              style={[styles.dayChip, selected && styles.dayChipSelected]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayName, selected && styles.dayNameSelected]}>{format(day, "EEE")}</Text>
              <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{format(day, "d")}</Text>
              {badge && <View style={[styles.dayDot, { backgroundColor: badge }]} />}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.dateLabel}>{format(selectedDay, "EEEE, MMMM d")}</Text>

        {/* Legend */}
        <View style={styles.legend}>
          {(["booked", "pending", "available", "unavailable"] as SlotStatus[]).map(s => (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: slotColor(s) }]} />
              <Text style={styles.legendText}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
            </View>
          ))}
        </View>

        {/* Slot cards */}
        <View style={styles.slotsContainer}>
          {SLOTS.map((slot) => {
            const status = getSlotStatus(slot.key);
            const task = getSlotTask(slot.key);
            return (
              <TouchableOpacity
                key={slot.key}
                style={[styles.slotCard, { backgroundColor: slotColor(status) }]}
                onPress={() => {
                  if (task) navigation.navigate("WorkerJobDetail", { taskId: task.id! });
                }}
                activeOpacity={task ? 0.75 : 1}
              >
                <View style={styles.slotLeft}>
                  <Text style={[styles.slotLabel, { color: slotTextColor(status) }]}>{slot.label}</Text>
                  <Text style={[styles.slotSub, { color: slotTextColor(status), opacity: 0.8 }]}>{slot.sub}</Text>
                  {task && (
                    <Text style={[styles.slotTaskTitle, { color: slotTextColor(status) }]} numberOfLines={1}>
                      {task.gig_title ?? task.title ?? "Job"}
                    </Text>
                  )}
                </View>
                {task && (
                  <Ionicons name="chevron-forward" size={20} color={slotTextColor(status)} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  availabilityBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  availabilityBtnText: { fontSize: 13, fontWeight: "600", color: colors.brandGreen },
  dayStrip: { backgroundColor: colors.card, flexGrow: 0 },
  dayStripContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  dayChip: {
    width: 56,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    position: "relative",
  },
  dayChipSelected: { backgroundColor: colors.brandGreen },
  dayName: { fontSize: 11, fontWeight: "600", color: colors.subtext, textTransform: "uppercase" },
  dayNameSelected: { color: "#fff" },
  dayNum: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 2 },
  dayNumSelected: { color: "#fff" },
  dayDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.md },
  dateLabel: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  legend: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap", marginBottom: spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.subtext },
  slotsContainer: { gap: spacing.sm },
  slotCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 72,
  },
  slotLeft: { flex: 1 },
  slotLabel: { fontSize: 16, fontWeight: "700" },
  slotSub: { fontSize: 12, marginTop: 2 },
  slotTaskTitle: { fontSize: 13, fontWeight: "600", marginTop: 6 },
});
