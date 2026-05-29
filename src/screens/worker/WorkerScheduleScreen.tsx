import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSchedule, updateSchedule } from "../../services/scheduleService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Button } from "../../components/common/Button";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { DayOfWeek, TaskerScheduleEntry } from "../../types";

const DAYS: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const SLOTS: { key: "morning_available" | "afternoon_available" | "evening_available"; label: string }[] = [
  { key: "morning_available",   label: "Morning"   },
  { key: "afternoon_available", label: "Afternoon" },
  { key: "evening_available",   label: "Evening"   },
];

const DEFAULT_ENTRY = (day: DayOfWeek): TaskerScheduleEntry => ({
  day,
  is_available: false,
  morning_available: true,
  afternoon_available: true,
  evening_available: true,
});

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.toggle, on && styles.toggleOn]} onPress={onPress} hitSlop={8}>
      <View style={[styles.toggleKnob, on && styles.toggleKnobOn]} />
    </Pressable>
  );
}

export function WorkerScheduleScreen() {
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const [schedule, setSchedule] = useState<TaskerScheduleEntry[]>(DAYS.map(DEFAULT_ENTRY));
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", dbUserId],
    queryFn: () => getSchedule(dbUserId!),
    enabled: !!dbUserId,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      const merged = DAYS.map((day) => {
        const entry = data.find((e) => e.day === day);
        return entry ?? DEFAULT_ENTRY(day);
      });
      setSchedule(merged);
    }
  }, [data]);

  const toggleDay = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((e) => (e.day === day ? { ...e, is_available: !e.is_available } : e))
    );
  };

  const toggleSlot = (day: DayOfWeek, slot: "morning_available" | "afternoon_available" | "evening_available") => {
    setSchedule((prev) =>
      prev.map((e) => (e.day === day ? { ...e, [slot]: !e[slot] } : e))
    );
  };

  const handleSave = async () => {
    if (!dbUserId) return;
    setSaving(true);
    try {
      await updateSchedule(dbUserId, schedule);
      await qc.invalidateQueries({ queryKey: ["schedule"] });
      await qc.invalidateQueries({ queryKey: ["avail-prefs"] });
      Alert.alert("Saved", "Your availability has been updated.");
    } catch {
      Alert.alert("Error", "Could not save availability.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>WEEKLY AVAILABILITY</Text>
        <View style={styles.sectionCard}>
          {schedule.map((entry, index) => {
            const anySlotOn = entry.morning_available || entry.afternoon_available || entry.evening_available;
            return (
              <View key={entry.day} style={index < schedule.length - 1 && styles.rowDivider}>
                {/* Day row */}
                <Pressable style={styles.dayRow} onPress={() => toggleDay(entry.day)}>
                  <Toggle on={!!entry.is_available} onPress={() => toggleDay(entry.day)} />
                  <Text style={styles.dayLabel}>
                    {entry.day.charAt(0).toUpperCase() + entry.day.slice(1)}
                  </Text>
                  <Text style={styles.availLabel}>
                    {entry.is_available
                      ? anySlotOn
                        ? [
                            entry.morning_available   && "Morning",
                            entry.afternoon_available && "Afternoon",
                            entry.evening_available   && "Evening",
                          ].filter(Boolean).join(" · ")
                        : "No slots selected"
                      : "Unavailable"}
                  </Text>
                </Pressable>

                {/* Slot toggles */}
                {entry.is_available && (
                  <View style={styles.slotRow}>
                    {SLOTS.map((slot) => (
                      <Pressable
                        key={slot.key}
                        style={[styles.slotChip, entry[slot.key] && styles.slotChipOn]}
                        onPress={() => toggleSlot(entry.day, slot.key)}
                      >
                        <Text style={[styles.slotChipText, entry[slot.key] && styles.slotChipTextOn]}>
                          {slot.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.footerActions}>
          <Button label="Save Changes" onPress={handleSave} loading={saving} style={styles.saveBtn} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    minHeight: 64,
  },
  dayLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  availLabel: { flex: 1, fontSize: 13, color: colors.subtext, textAlign: "right" },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: colors.brandGreen },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobOn: { alignSelf: "flex-end" },
  slotRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 2,
  },
  slotChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  slotChipOn: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreen + "15",
  },
  slotChipText: { fontSize: 13, fontWeight: "600", color: colors.subtext },
  slotChipTextOn: { color: colors.brandGreen },
  footerActions: { marginTop: 24 },
  saveBtn: { height: 52, borderRadius: 14, backgroundColor: colors.brandGreen },
});
