import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "../../services/scheduleService";
import { getGigById } from "../../services/gigService";
import { BookingStepDots } from "../../components/booking/BookingStepDots";
import { StickyPriceCTA } from "../../components/booking/StickyPriceCTA";
import { DateChip } from "../../components/booking/DateChip";
import { TimeSlotChip } from "../../components/booking/TimeSlotChip";
import { SkeletonCard } from "../../components/booking/SkeletonCard";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, addDays } from "date-fns";

type RouteProps = RouteProp<BookingFlowParamList, "DateTimeSelection">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

function isoDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
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
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

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
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <BookingStepDots currentStep={3} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>When do you need this?</Text>

        <Text style={styles.sectionLabel}>Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
          {days.map((d) => {
            const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
            return (
              <DateChip
                key={format(d, "yyyy-MM-dd")}
                date={d}
                selected={!!isSelected}
                onPress={() => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
              />
            );
          })}
        </ScrollView>

        {selectedDate && (
          <View style={styles.slotsSection}>
            <Text style={styles.sectionLabel}>Available times</Text>
            
            {slotsLoading ? (
              <View style={styles.slotsGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} variant="timeslot" />
                ))}
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
                <Text style={styles.emptyTitle}>No slots available</Text>
                <Text style={styles.emptySub}>Try selecting another date for this tasker.</Text>
              </View>
            ) : (
              <>
                {amSlots.length > 0 && (
                  <View style={styles.periodSection}>
                    <Text style={styles.periodLabel}>Morning</Text>
                    <View style={styles.slotsGrid}>
                      {amSlots.map((slot) => (
                        <TimeSlotChip
                          key={slot}
                          time={formatSlot(slot)}
                          selected={selectedSlot === slot}
                          onPress={() => setSelectedSlot(slot)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {pmSlots.length > 0 && (
                  <View style={styles.periodSection}>
                    <Text style={styles.periodLabel}>Afternoon & Evening</Text>
                    <View style={styles.slotsGrid}>
                      {pmSlots.map((slot) => (
                        <TimeSlotChip
                          key={slot}
                          time={formatSlot(slot)}
                          selected={selectedSlot === slot}
                          onPress={() => setSelectedSlot(slot)}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {selectedDate && selectedSlot && (
          <View style={styles.selectionSummary}>
            <Text style={styles.sectionLabel}>Your selection</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={20} color={colors.brandGreen} />
                <Text style={styles.summaryText}>{format(selectedDate, "EEEE, d MMMM")}</Text>
              </View>
              <View style={[styles.summaryItem, { marginTop: spacing.sm }]}>
                <Ionicons name="time" size={20} color={colors.brandGreen} />
                <Text style={styles.summaryText}>{formatSlot(selectedSlot)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <StickyPriceCTA
        label="Continue"
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
        disabled={!selectedDate || !selectedSlot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: {
    backgroundColor: colors.card,
    zIndex: 10,
  },
  headerContent: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: spacing.lg, paddingBottom: 120 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  daysScroll: {
    marginBottom: spacing.xl,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  slotsSection: {
    marginBottom: spacing.xl,
  },
  periodSection: {
    marginBottom: spacing.md,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.subtext,
    marginBottom: spacing.sm,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
    textAlign: "center",
  },
  selectionSummary: {
    marginTop: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandGreen + "20",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.md,
  },
});
