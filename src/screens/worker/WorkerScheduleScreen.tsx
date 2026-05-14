import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Dimensions,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getSchedule, updateSchedule } from "../../services/scheduleService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Button } from "../../components/common/Button";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DayOfWeek, TaskerScheduleEntry } from "../../types";

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DEFAULT_ENTRY = (day: DayOfWeek): TaskerScheduleEntry => ({
  day,
  is_available: false,
  start_time: "09:00",
  end_time: "17:00",
});

const TIME_OPTIONS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

export function WorkerScheduleScreen() {
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const [schedule, setSchedule] = useState<TaskerScheduleEntry[]>(
    DAYS.map(DEFAULT_ENTRY)
  );
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(null);

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  const isTabRoot = route.name === "WorkerSchedule";

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", dbUserId],
    queryFn: () => getSchedule(dbUserId!),
    enabled: !!dbUserId,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      const merged = DAYS.map(
        (day) => data.find((e) => e.day === day) ?? DEFAULT_ENTRY(day)
      );
      setSchedule(merged);
    }
  }, [data]);

  const toggle = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((e) => {
        if (e.day === day) {
          const nextVal = !e.is_available;
          if (!nextVal && expandedDay === day) {
            setExpandedDay(null);
          }
          return { ...e, is_available: nextVal };
        }
        return e;
      })
    );
  };

  const toggleExpand = (day: DayOfWeek) => {
    const entry = schedule.find(e => e.day === day);
    if (entry?.is_available) {
      setExpandedDay(expandedDay === day ? null : day);
    }
  };

  const setTime = (
    day: DayOfWeek,
    field: "start_time" | "end_time",
    time: string
  ) => {
    setSchedule((prev) =>
      prev.map((e) => (e.day === day ? { ...e, [field]: time } : e))
    );
  };

  const handleSave = async () => {
    if (!dbUserId) return;
    setSaving(true);
    try {
      await updateSchedule(dbUserId, schedule);
      await qc.invalidateQueries({ queryKey: ["schedule"] });
      Alert.alert("Saved", "Your schedule has been updated.");
    } catch {
      Alert.alert("Error", "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {isTabRoot && (
        <View style={styles.header}>
          <Text style={styles.heading}>Schedule</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          {schedule.map((entry, index) => (
            <View key={entry.day} style={index < schedule.length - 1 && styles.rowDivider}>
              <Pressable
                style={styles.dayRow}
                onPress={() => toggleExpand(entry.day)}
              >
                <Pressable onPress={() => toggle(entry.day)} style={styles.toggleContainer}>
                  <View
                    style={[styles.toggle, entry.is_available && styles.toggleOn]}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        entry.is_available && styles.toggleKnobOn,
                      ]}
                    />
                  </View>
                </Pressable>
                
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayLabel}>
                    {entry.day.charAt(0).toUpperCase() + entry.day.slice(1)}
                  </Text>
                  <Text style={styles.availLabel}>
                    {entry.is_available
                      ? `${entry.start_time} – ${entry.end_time}`
                      : "Unavailable"}
                  </Text>
                </View>

                {entry.is_available && (
                  <Ionicons
                    name={expandedDay === entry.day ? "chevron-up" : "chevron-forward"}
                    size={20}
                    color={colors.placeholder}
                  />
                )}
              </Pressable>

              {expandedDay === entry.day && (
                <View style={styles.expandedPanel}>
                  <View style={styles.pickerGridContainer}>
                    <Text style={styles.gridSectionTitle}>START TIME</Text>
                    <View style={styles.timeGrid}>
                      {TIME_OPTIONS.map((t) => (
                        <Pressable
                          key={t}
                          style={[
                            styles.gridChip,
                            entry.start_time === t && styles.gridChipSelected,
                          ]}
                          onPress={() => setTime(entry.day, "start_time", t)}
                        >
                          <Text
                            style={[
                              styles.gridChipText,
                              entry.start_time === t && styles.gridChipTextSelected,
                            ]}
                          >
                            {t}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.pickerGridContainer, { marginTop: 16 }]}>
                    <Text style={styles.gridSectionTitle}>END TIME</Text>
                    <View style={styles.timeGrid}>
                      {TIME_OPTIONS.map((t) => (
                        <Pressable
                          key={t}
                          style={[
                            styles.gridChip,
                            entry.end_time === t && styles.gridChipSelected,
                          ]}
                          onPress={() => setTime(entry.day, "end_time", t)}
                        >
                          <Text
                            style={[
                              styles.gridChipText,
                              entry.end_time === t && styles.gridChipTextSelected,
                            ]}
                          >
                            {t}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.footerActions}>
          <Button
            label="Save Changes"
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
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
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 2,
  },
  content: { padding: spacing.lg, paddingBottom: 48 },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    height: 72,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toggleContainer: {
    padding: 4,
  },
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
  dayLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  availLabel: { fontSize: 13, color: colors.subtext, marginTop: 1 },
  expandedPanel: {
    backgroundColor: "#F9FAFB", // Very light gray for the expanded section
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  pickerGridContainer: {
    gap: 12,
  },
  gridSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
    letterSpacing: 0.5,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridChip: {
    width: (Dimensions.get("window").width - spacing.lg * 2 - 32 - 24) / 4, // 4 columns
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  gridChipSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  gridChipText: { fontSize: 13, color: colors.text, fontWeight: "500" },
  gridChipTextSelected: { color: "#fff", fontWeight: "600" },
  footerActions: { marginTop: 24 },
  saveBtn: { height: 52, borderRadius: 14, backgroundColor: colors.brandGreen },
});

