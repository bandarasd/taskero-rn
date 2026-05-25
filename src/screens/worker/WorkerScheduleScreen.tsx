import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
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
import { useRoute } from "@react-navigation/native";
import { DayOfWeek, TaskerScheduleEntry } from "../../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6..20
const MINUTES = [0, 30];
const GRACE_OPTIONS = [15, 30, 45, 60];

const ITEM_H = 44;

const DEFAULT_ENTRY = (day: DayOfWeek): TaskerScheduleEntry => ({
  day,
  is_available: false,
  start_time: "09:00",
  end_time: "17:00",
  buffer_minutes: 30,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function localHHMMtoUTC(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function utcHHMMtoLocal(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setUTCHours(h, m, 0, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toHHMM(hour: number, minute: number) {
  return `${pad(hour)}:${pad(minute)}`;
}

function parseHHMM(t: string): [number, number] {
  const [h, m] = t.split(":").map(Number);
  return [h, m];
}

function formatHour(h: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${suffix}`;
}

// ─── PanResponder Drum-roll Picker ────────────────────────────────────────────

type ColumnPickerProps<T extends number> = {
  data: T[];
  selected: T;
  onSelect: (val: T) => void;
  formatItem: (val: T) => string;
};

function ColumnPicker<T extends number>({
  data,
  selected,
  onSelect,
  formatItem,
}: ColumnPickerProps<T>) {
  const selectedIdx = Math.max(0, data.indexOf(selected));
  const translateY = useRef(new Animated.Value(-selectedIdx * ITEM_H)).current;
  const currentOffset = useRef(-selectedIdx * ITEM_H);

  // Sync scroll position when selected or data changes externally
  useEffect(() => {
    const idx = Math.max(0, data.indexOf(selected));
    const target = -idx * ITEM_H;
    Animated.spring(translateY, {
      toValue: target,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
    currentOffset.current = target;
  }, [selected, data.length]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 3,
      onPanResponderMove: (_, { dy }) => {
        translateY.setValue(currentOffset.current + dy);
      },
      onPanResponderRelease: (_, { dy }) => {
        const raw = currentOffset.current + dy;
        const idx = Math.round(-raw / ITEM_H);
        const clamped = Math.max(0, Math.min(idx, data.length - 1));
        const snapped = -clamped * ITEM_H;
        Animated.spring(translateY, {
          toValue: snapped,
          useNativeDriver: true,
          tension: 120,
          friction: 10,
        }).start();
        currentOffset.current = snapped;
        onSelect(data[clamped]);
      },
    })
  ).current;

  return (
    <View style={colStyles.wrapper} {...panResponder.panHandlers}>
      {/* selection highlight band */}
      <View style={colStyles.highlight} pointerEvents="none" />

      {/* top / bottom fade masks */}
      <View style={[colStyles.fade, colStyles.fadeTop]} pointerEvents="none" />
      <View style={[colStyles.fade, colStyles.fadeBottom]} pointerEvents="none" />

      {/* items — offset by one ITEM_H so the first item can be centred */}
      <Animated.View
        style={[colStyles.list, { transform: [{ translateY }], top: ITEM_H }]}
      >
        {data.map((item) => (
          <View key={item} style={colStyles.item}>
            <Text
              style={[
                colStyles.itemText,
                item === selected && colStyles.itemTextSelected,
              ]}
            >
              {formatItem(item)}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const colStyles = StyleSheet.create({
  wrapper: {
    height: ITEM_H * 3,
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  highlight: {
    position: "absolute",
    top: ITEM_H,
    left: 8,
    right: 8,
    height: ITEM_H,
    backgroundColor: colors.brandGreen + "18",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandGreen + "40",
    zIndex: 1,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ITEM_H,
    zIndex: 2,
  },
  fadeTop: { top: 0, backgroundColor: "rgba(249,250,251,0.7)" },
  fadeBottom: { bottom: 0, backgroundColor: "rgba(249,250,251,0.7)" },
  list: { position: "absolute", left: 0, right: 0 },
  item: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 16,
    color: colors.subtext,
    fontWeight: "400",
  },
  itemTextSelected: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 17,
  },
});

// ─── TimePicker (hour + minute columns) ──────────────────────────────────────

type TimePickerProps = {
  value: string;
  onChange: (val: string) => void;
  startTime?: string;
};

function TimePicker({ value, onChange, startTime }: TimePickerProps) {
  const [hour, minute] = parseHHMM(value);
  const [startH, startM] = startTime ? parseHHMM(startTime) : [0, -1];

  const availableHours = startTime
    ? HOURS.filter((h) =>
        h > startH || (h === startH && MINUTES.some((m) => m > startM))
      )
    : HOURS;

  const availableMinutes = startTime
    ? MINUTES.filter((m) => (hour > startH ? true : hour === startH && m > startM))
    : MINUTES;

  const handleHourChange = (h: number) => {
    let m = minute;
    if (startTime) {
      const valid = MINUTES.filter((mm) =>
        h > startH ? true : h === startH && mm > startM
      );
      if (!valid.includes(m)) m = valid[0] ?? MINUTES[0];
    }
    onChange(toHHMM(h, m));
  };

  const safeHour = availableHours.includes(hour) ? hour : availableHours[0] ?? HOURS[0];
  const safeMinute = availableMinutes.includes(minute)
    ? minute
    : availableMinutes[0] ?? MINUTES[0];

  return (
    <View style={tpStyles.row}>
      <ColumnPicker
        data={availableHours}
        selected={safeHour}
        onSelect={handleHourChange}
        formatItem={formatHour}
      />
      <Text style={tpStyles.colon}>:</Text>
      <ColumnPicker
        data={availableMinutes}
        selected={safeMinute}
        onSelect={(m) => onChange(toHHMM(safeHour, m))}
        formatItem={(m) => pad(m)}
      />
    </View>
  );
}

const tpStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  colon: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 2 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WorkerScheduleScreen() {
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const [schedule, setSchedule] = useState<TaskerScheduleEntry[]>(
    DAYS.map(DEFAULT_ENTRY)
  );
  const [gracePeriod, setGracePeriod] = useState(30);
  const [saving, setSaving] = useState(false);
  const route = useRoute();
  const isTabRoot = route.name === "WorkerSchedule";

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", dbUserId],
    queryFn: () => getSchedule(dbUserId!),
    enabled: !!dbUserId,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      const merged = DAYS.map((day) => {
        const entry = data.find((e) => e.day === day);
        if (!entry) return DEFAULT_ENTRY(day);
        return {
          ...entry,
          start_time: utcHHMMtoLocal(entry.start_time),
          end_time: utcHHMMtoLocal(entry.end_time),
        };
      });
      setSchedule(merged);
      const buf = data.find((e) => e.buffer_minutes != null)?.buffer_minutes;
      setGracePeriod(buf ?? 30);
    }
  }, [data]);

  const selectGrace = (mins: number) => {
    setGracePeriod(mins);
    setSchedule((prev) => prev.map((e) => ({ ...e, buffer_minutes: mins })));
  };

  const toggle = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((e) =>
        e.day === day ? { ...e, is_available: !e.is_available } : e
      )
    );
  };

  const setStartTime = (day: DayOfWeek, time: string) => {
    setSchedule((prev) =>
      prev.map((e) => {
        if (e.day !== day) return e;
        const updated = { ...e, start_time: time };
        const [sh, sm] = parseHHMM(time);
        const [eh, em] = parseHHMM(e.end_time ?? "17:00");
        if (eh < sh || (eh === sh && em <= sm)) {
          const nextM = MINUTES.find((m) => m > sm);
          updated.end_time =
            nextM !== undefined
              ? toHHMM(sh, nextM)
              : toHHMM(Math.min(sh + 1, 20), MINUTES[0]);
        }
        return updated;
      })
    );
  };

  const handleSave = async () => {
    if (!dbUserId) return;
    setSaving(true);
    try {
      const utcSchedule = schedule.map((e) => ({
        ...e,
        start_time: localHHMMtoUTC(e.start_time),
        end_time: localHHMMtoUTC(e.end_time),
      }));
      await updateSchedule(dbUserId, utcSchedule);
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
        {/* Grace period */}
        <Text style={styles.sectionLabel}>GRACE PERIOD BETWEEN TASKS</Text>
        <View style={styles.graceRow}>
          {GRACE_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              style={[styles.graceChip, gracePeriod === opt && styles.graceChipSelected]}
              onPress={() => selectGrace(opt)}
            >
              <Text
                style={[
                  styles.graceChipText,
                  gracePeriod === opt && styles.graceChipTextSelected,
                ]}
              >
                {opt} min
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Days */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
          AVAILABILITY
        </Text>
        <View style={styles.sectionCard}>
          {schedule.map((entry, index) => (
            <View
              key={entry.day}
              style={index < schedule.length - 1 && styles.rowDivider}
            >
              <Pressable style={styles.dayRow} onPress={() => toggle(entry.day)}>
                <View style={[styles.toggle, entry.is_available && styles.toggleOn]}>
                  <View
                    style={[
                      styles.toggleKnob,
                      entry.is_available && styles.toggleKnobOn,
                    ]}
                  />
                </View>

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
              </Pressable>

              {entry.is_available && (
                <View style={styles.timePickers}>
                  <View style={styles.pickerBlock}>
                    <Text style={styles.pickerLabel}>START TIME</Text>
                    <TimePicker
                      value={entry.start_time ?? "09:00"}
                      onChange={(t) => setStartTime(entry.day, t)}
                    />
                  </View>

                  <View style={styles.pickerSep} />

                  <View style={styles.pickerBlock}>
                    <Text style={styles.pickerLabel}>END TIME</Text>
                    <TimePicker
                      value={entry.end_time ?? "17:00"}
                      onChange={(t) =>
                        setSchedule((prev) =>
                          prev.map((e) =>
                            e.day === entry.day ? { ...e, end_time: t } : e
                          )
                        )
                      }
                      startTime={entry.start_time ?? "09:00"}
                    />
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  heading: { fontSize: 26, fontWeight: "700", color: colors.text },
  content: { padding: spacing.lg, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  graceRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  graceChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  graceChipSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreen + "15",
  },
  graceChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.subtext,
  },
  graceChipTextSelected: {
    color: colors.brandGreen,
  },
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
    minHeight: 72,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
  timePickers: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  pickerBlock: { flex: 1, alignItems: "center", gap: 6 },
  pickerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
    letterSpacing: 0.5,
  },
  pickerSep: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  footerActions: { marginTop: 24 },
  saveBtn: { height: 52, borderRadius: 14, backgroundColor: colors.brandGreen },
});
