import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "../../services/scheduleService";
import { getGigById } from "../../services/gigService";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { BookingProgressBar } from "../../components/bookings/BookingProgressBar";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";

type RouteProps = RouteProp<BookingFlowParamList, "DateTimeSelection">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

function isoDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(d: Date, n: number) {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function formatSlot(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function isAM(slot: string) {
  return parseInt(slot.split(":")[0]) < 12;
}

export function DateTimeSelectionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId, taskerId, address, latitude, longitude } = route.params;

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1));

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: gig } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", taskerId, selectedDate ? isoDateString(selectedDate) : null],
    queryFn: () => getAvailableSlots(taskerId, isoDateString(selectedDate!)),
    enabled: !!selectedDate && !!taskerId,
  });

  const slots = slotsData?.available_slots ?? [];
  const amSlots = slots.filter(isAM);
  const pmSlots = slots.filter((s) => !isAM(s));

  const buildScheduledAt = () => {
    if (!selectedDate || !selectedSlot) return "";
    const [h, m] = selectedSlot.split(":").map(Number);
    const d = new Date(selectedDate);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  return (
    <View style={styles.container}>
      <BookingProgressBar currentStep={3} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>When do you need service?</Text>

        {/* Date picker */}
        <Text style={styles.sectionLabel}>Select a Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
          {days.map((d) => {
            const iso = isoDateString(d);
            const isSelected = selectedDate ? isoDateString(selectedDate) === iso : false;
            return (
              <Pressable
                key={iso}
                style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                onPress={() => { setSelectedDate(d); setSelectedSlot(null); }}
              >
                <Text style={[styles.dayWeekday, isSelected && styles.dayTextSelected]}>
                  {d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayTextSelected]}>
                  {d.getDate()}
                </Text>
                <Text style={[styles.dayMonth, isSelected && styles.dayTextSelected]}>
                  {d.toLocaleDateString("en-US", { month: "short" })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Time slots */}
        {selectedDate && (
          <View style={styles.slotsSection}>
            <Text style={styles.sectionLabel}>
              Available Times — {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
            {slotsLoading ? (
              <LoadingSpinner style={{ height: 80 }} size="small" />
            ) : slots.length === 0 ? (
              <View style={styles.noSlotsCard}>
                <Text style={styles.noSlotsIcon}>📅</Text>
                <Text style={styles.noSlotsTitle}>No availability</Text>
                <Text style={styles.noSlotsSub}>This worker has no open slots on this date. Try another day.</Text>
              </View>
            ) : (
              <>
                {amSlots.length > 0 && (
                  <>
                    <Text style={styles.periodLabel}>Morning</Text>
                    <View style={styles.slotsGrid}>
                      {amSlots.map((slot) => (
                        <SlotChip key={slot} slot={slot} selected={selectedSlot === slot} onPress={() => setSelectedSlot(slot)} />
                      ))}
                    </View>
                  </>
                )}
                {pmSlots.length > 0 && (
                  <>
                    <Text style={styles.periodLabel}>Afternoon & Evening</Text>
                    <View style={styles.slotsGrid}>
                      {pmSlots.map((slot) => (
                        <SlotChip key={slot} slot={slot} selected={selectedSlot === slot} onPress={() => setSelectedSlot(slot)} />
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {!selectedDate && (
          <View style={styles.promptCard}>
            <Text style={styles.promptIcon}>👆</Text>
            <Text style={styles.promptText}>Select a date above to see available time slots.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {selectedDate && selectedSlot && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionBadgeText}>
              📅 {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {formatSlot(selectedSlot)}
            </Text>
          </View>
        )}
        <Button
          label="Continue: Service Details"
          disabled={!selectedDate || !selectedSlot}
          onPress={() =>
            navigation.navigate("ServiceSpecific", {
              gigId,
              taskerId,
              address,
              latitude,
              longitude,
              scheduledAt: buildScheduledAt(),
              category: gig?.category ?? "General",
            })
          }
        />
      </View>
    </View>
  );
}

function SlotChip({ slot, selected, onPress }: { slot: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.slotChip, selected && styles.slotChipSelected]} onPress={onPress}>
      <Text style={[styles.slotText, selected && styles.slotTextSelected]}>{formatSlot(slot)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.subtext, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.4 },

  daysScroll: { marginBottom: 28 },
  dayChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    minWidth: 62,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dayChipSelected: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  dayWeekday: { fontSize: 10, color: colors.subtext, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4 },
  dayNum: { fontSize: 22, fontWeight: "800", color: colors.text, lineHeight: 26 },
  dayMonth: { fontSize: 10, color: colors.subtext, marginTop: 2 },
  dayTextSelected: { color: "#fff" },

  slotsSection: { marginBottom: 16 },
  periodLabel: { fontSize: 12, fontWeight: "700", color: colors.subtext, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  slotChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 96,
    alignItems: "center",
  },
  slotChipSelected: { backgroundColor: colors.brandGreen, borderColor: colors.brandGreen },
  slotText: { fontSize: 14, fontWeight: "600", color: colors.text },
  slotTextSelected: { color: "#fff" },

  noSlotsCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
  },
  noSlotsIcon: { fontSize: 32, marginBottom: 10 },
  noSlotsTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 },
  noSlotsSub: { fontSize: 13, color: colors.subtext, textAlign: "center", lineHeight: 19 },

  promptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  promptIcon: { fontSize: 20 },
  promptText: { fontSize: 14, color: colors.subtext, flex: 1 },

  footer: { padding: spacing.lg, paddingBottom: 36 },
  selectionBadge: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  selectionBadgeText: { fontSize: 13, fontWeight: "600", color: colors.brandGreenDark },
});
