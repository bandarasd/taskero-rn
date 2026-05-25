import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "../../services/scheduleService";
import { getGigById } from "../../services/gigService";
import { BookingStepDots } from "../../components/booking/BookingStepDots";
import { StickyPriceCTA } from "../../components/booking/StickyPriceCTA";
import { DateChip } from "../../components/booking/DateChip";
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

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const buildScheduledAt = () => {
    if (!selectedDate || !selectedSlot) return "";
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return `${dateStr}T${selectedSlot}:00`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <BookingStepDots currentStep={2} />
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
              <SkeletonCard variant="timeslot" />
            ) : slots.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
                <Text style={styles.emptyTitle}>No slots available</Text>
                <Text style={styles.emptySub}>Try selecting another date for this tasker.</Text>
              </View>
            ) : (
              <>
                <Pressable
                  style={[styles.dropdownTrigger, dropdownOpen && styles.dropdownTriggerOpen]}
                  onPress={() => setDropdownOpen(true)}
                >
                  <View style={styles.dropdownTriggerLeft}>
                    <Ionicons name="time-outline" size={20} color={selectedSlot ? colors.brandGreen : colors.placeholder} />
                    <Text style={[styles.dropdownTriggerText, !selectedSlot && styles.dropdownPlaceholder]}>
                      {selectedSlot ? formatSlot(selectedSlot) : "Select a time"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.subtext} />
                </Pressable>

                <Modal
                  visible={dropdownOpen}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setDropdownOpen(false)}
                >
                  <Pressable style={styles.modalOverlay} onPress={() => setDropdownOpen(false)}>
                    <View style={styles.dropdownSheet}>
                      <View style={styles.dropdownHeader}>
                        <Text style={styles.dropdownHeaderTitle}>Select a time</Text>
                        <Pressable onPress={() => setDropdownOpen(false)}>
                          <Ionicons name="close" size={22} color={colors.text} />
                        </Pressable>
                      </View>
                      <FlatList
                        data={[
                          ...(amSlots.length > 0 ? [{ type: "header" as const, label: "Morning" }, ...amSlots.map((s) => ({ type: "slot" as const, value: s }))] : []),
                          ...(pmSlots.length > 0 ? [{ type: "header" as const, label: "Afternoon & Evening" }, ...pmSlots.map((s) => ({ type: "slot" as const, value: s }))] : []),
                        ]}
                        keyExtractor={(item, i) => String(i)}
                        renderItem={({ item }) => {
                          if (item.type === "header") {
                            return <Text style={styles.dropdownGroupLabel}>{item.label}</Text>;
                          }
                          const isSelected = selectedSlot === item.value;
                          return (
                            <Pressable
                              style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                              onPress={() => {
                                setSelectedSlot(item.value);
                                setDropdownOpen(false);
                              }}
                            >
                              <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                                {formatSlot(item.value)}
                              </Text>
                              {isSelected && <Ionicons name="checkmark" size={18} color={colors.brandGreen} />}
                            </Pressable>
                          );
                        }}
                      />
                    </View>
                  </Pressable>
                </Modal>
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
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dropdownTriggerOpen: {
    borderColor: colors.brandGreen,
  },
  dropdownTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dropdownTriggerText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.sm,
  },
  dropdownPlaceholder: {
    color: colors.placeholder,
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  dropdownSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "60%",
    paddingBottom: spacing.xl,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  dropdownGroupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownItemSelected: {
    backgroundColor: colors.brandGreenLight,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownItemTextSelected: {
    color: colors.brandGreen,
    fontWeight: "600",
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
