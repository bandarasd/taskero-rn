import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity, Linking, Platform } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getTaskById, respondToQuote } from "../services/taskService";
import { getUserById } from "../services/userService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { TaskStatus } from "../types";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type RouteProps = RouteProp<CustomerStackParamList, "AppointmentDetail">;
type Nav = NativeStackNavigationProp<CustomerStackParamList>;

// --- Helpers ---
function fmtDate(iso?: string | null) {
  if (!iso) return "Not scheduled";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const JOURNEY_STEPS: { key: TaskStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "quoted", label: "Quoted" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

// --- Components ---

function StatusJourney({ currentStatus }: { currentStatus: TaskStatus }) {
  const isTerminal = currentStatus === "canceled" || currentStatus === "declined";
  
  if (isTerminal) {
    return (
      <View style={styles.terminalStatusStrip}>
        <Ionicons name="close-circle" size={20} color={colors.danger} />
        <Text style={styles.terminalStatusText}>
          Booking {currentStatus === "canceled" ? "Cancelled" : "Declined"}
        </Text>
      </View>
    );
  }

  const currentIndex = JOURNEY_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <View style={styles.journeyContainer}>
      <View style={styles.journeyLineContainer}>
        {JOURNEY_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Node */}
              <View style={styles.nodeWrapper}>
                <View
                  style={[
                    styles.node,
                    isCompleted || isActive ? styles.nodeActive : styles.nodeFuture,
                  ]}
                >
                  {(isCompleted || currentStatus === "completed") ? (
                    <Ionicons name="checkmark" size={12} color="white" />
                  ) : isActive ? (
                    <View style={styles.activeDot} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.nodeLabel,
                    isActive && styles.nodeLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connector */}
              {index < JOURNEY_STEPS.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    index < currentIndex ? styles.connectorActive : styles.connectorFuture,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

function DetailRow({ 
  icon, 
  label, 
  value, 
  onPress, 
  isLast 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity 
      style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.detailRowLeft}>
        <Ionicons name={icon} size={20} color={colors.subtext} style={{ marginRight: 12 }} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </TouchableOpacity>
  );
}

export function AppointmentDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { taskId } = route.params;
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [respondLoading, setRespondLoading] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

  const { data: tasker } = useQuery({
    queryKey: ["user", task?.tasker_id],
    queryFn: () => getUserById(task!.tasker_id!),
    enabled: !!task?.tasker_id,
  });

  const handleRespond = async (accepted: boolean) => {
    setRespondLoading(true);
    try {
      await respondToQuote(taskId, accepted);
      await qc.invalidateQueries({ queryKey: ["task", taskId] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch {
      Alert.alert("Error", "Could not respond to quote");
    } finally {
      setRespondLoading(false);
    }
  };

  const openInMaps = () => {
    if (!task?.location_address) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(task.location_address)}`,
      android: `geo:0,0?q=${encodeURIComponent(task.location_address)}`,
    });
    if (url) Linking.openURL(url);
  };

  if (isLoading || !task) return <LoadingSpinner />;

  const workerName = tasker ? `${tasker.first_name ?? ""} ${tasker.last_name ?? ""}`.trim() : "Worker";

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Section */}
        <LinearGradient
          colors={[colors.brandGreenLight, "#FFFFFF"]}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>{task.gig_title ?? task.gig?.title ?? task.title ?? "Service"}</Text>
        </LinearGradient>

        {/* 2. Status Journey Strip */}
        <StatusJourney currentStatus={task.status} />

        {/* 3. Worker Card Section */}
        <View style={styles.section}>
          <View style={styles.workerRow}>
            <Avatar uri={tasker?.avatar_url} name={workerName} size={56} />
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{workerName}</Text>
              <Text style={styles.workerSubtitle}>Your service provider</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Ionicons key={i} name="star" size={14} color="#D1D5DB" style={{ marginRight: 2 }} />
                ))}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.messageLink}
              onPress={() =>
                navigation.navigate("Chat", {
                  threadId: task.id,
                  otherUserName: workerName,
                })
              }
            >
              <Text style={styles.messageLinkText}>Message</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.brandGreen} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Booking Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APPOINTMENT DETAILS</Text>
          <DetailRow 
            icon="calendar-outline" 
            label="Date" 
            value={fmtDate(task.scheduled_at)} 
          />
          <DetailRow 
            icon="time-outline" 
            label="Time" 
            value={fmtTime(task.scheduled_at) || "—"} 
          />
          <DetailRow 
            icon="location-outline" 
            label="Location" 
            value={task.location_address ?? "—"} 
            onPress={openInMaps}
          />
          <DetailRow 
            icon="grid-outline" 
            label="Category" 
            value={task.category ?? "—"} 
          />
          {task.notes ? (
            <DetailRow 
              icon="document-text-outline" 
              label="Notes" 
              value={task.notes} 
              isLast
            />
          ) : null}
        </View>

        {/* 5. Pricing Breakdown Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PRICING</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Price</Text>
            <Text style={styles.priceValue}>
              {task.base_price != null ? `Rs. ${task.base_price}` : "—"}
            </Text>
          </View>
          
          {task.quoted_price != null && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Quoted Price</Text>
              <Text style={styles.priceValue}>Rs. {task.quoted_price}</Text>
            </View>
          )}

          {task.status === "pending" && !task.quoted_price && (
            <Text style={styles.pendingQuoteText}>Pending quote from worker</Text>
          )}

          {task.final_price != null && (
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>Rs. {task.final_price}</Text>
            </View>
          )}
        </View>

        {/* 6. Quote Action Banner (if status === "quoted") */}
        {task.status === "quoted" && (
          <View style={styles.quoteBanner}>
            <Text style={styles.quoteSubtitle}>Your worker has sent a quote</Text>
            <Text style={styles.quoteAmount}>Rs. {task.quoted_price}</Text>
            {task.quote_expires_at && (
              <View style={styles.expiryRow}>
                <Ionicons name="time-outline" size={14} color={colors.warning} />
                <Text style={styles.expiryText}>
                  Expires {new Date(task.quote_expires_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
            <View style={styles.quoteActions}>
              <Button
                label="Decline"
                onPress={() => handleRespond(false)}
                variant="outline"
                style={styles.quoteActionBtn}
                textColor={colors.danger}
                borderColor={colors.danger}
                disabled={respondLoading}
              />
              <Button
                label="Accept"
                onPress={() => handleRespond(true)}
                style={styles.quoteActionBtn}
                loading={respondLoading}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* 7. Sticky Bottom Bar */}
      {task.status !== "quoted" && <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {task.status === "pending" && (
          <View style={styles.disabledBar}>
            <Text style={styles.disabledBarText}>Awaiting quote from worker</Text>
          </View>
        )}

        {(task.status === "accepted" || task.status === "in_progress") && (
          <Button
            label="Message Worker"
            onPress={() =>
              navigation.navigate("Chat", {
                threadId: task.id,
                otherUserName: workerName,
              })
            }
            fullWidth
          />
        )}
        {task.status === "completed" && (
          <Button
            label="Book Again"
            onPress={() => {
              if (task.gig_id) {
                navigation.navigate("ServiceDetail", { gigId: task.gig_id });
              }
            }}
            fullWidth
          />
        )}
        {(task.status === "canceled" || task.status === "declined") && (
          <Button
            label="Find Another Worker"
            variant="outline"
            onPress={() => navigation.navigate("Home")}
            fullWidth
          />
        )}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollView: { flex: 1 },
  
  // Hero
  hero: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center", paddingHorizontal: 20 },

  // Journey
  journeyContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  journeyLineContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  nodeWrapper: {
    alignItems: "center",
    width: 60,
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    marginBottom: 8,
  },
  nodeActive: { backgroundColor: colors.brandGreen },
  nodeFuture: { 
    backgroundColor: "#FFFFFF", 
    borderWidth: 2, 
    borderColor: "#D1D5DB" 
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  nodeLabel: {
    fontSize: 10,
    color: colors.subtext,
    textAlign: "center",
    fontWeight: "500",
  },
  nodeLabelActive: {
    color: colors.text,
    fontWeight: "700",
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: 11,
    marginHorizontal: -15,
    zIndex: 1,
  },
  connectorActive: { backgroundColor: colors.brandGreen },
  connectorFuture: { backgroundColor: "#D1D5DB" },

  terminalStatusStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.dangerLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.danger + "20",
  },
  terminalStatusText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: colors.danger,
  },

  // Sections
  section: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 8,
    borderBottomColor: colors.background,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtext,
    marginBottom: 16,
    letterSpacing: 1,
  },

  // Worker
  workerRow: { flexDirection: "row", alignItems: "center" },
  workerInfo: { flex: 1, marginLeft: 16 },
  workerName: { fontSize: 18, fontWeight: "700", color: colors.text },
  workerSubtitle: { fontSize: 13, color: colors.subtext, marginTop: 2 },
  ratingRow: { flexDirection: "row", marginTop: 4 },
  messageLink: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  messageLinkText: { fontSize: 14, fontWeight: "600", color: colors.brandGreen, marginRight: 2 },

  // Details
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailRowLeft: { flexDirection: "row", alignItems: "center" },
  detailLabel: { fontSize: 15, color: colors.subtext },
  detailValue: { fontSize: 15, fontWeight: "500", color: colors.text, maxWidth: "65%", textAlign: "right" },

  // Pricing
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  priceLabel: { fontSize: 15, color: colors.subtext },
  priceValue: { fontSize: 15, color: colors.text },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 18, fontWeight: "800", color: colors.brandGreen },
  pendingQuoteText: { fontSize: 14, color: colors.subtext, fontStyle: "italic", marginTop: 4 },

  // Quote Banner
  quoteBanner: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.brandGreenLight,
    borderRadius: 16,
    alignItems: "center",
  },
  quoteSubtitle: { fontSize: 14, color: colors.subtext, marginBottom: 8 },
  quoteAmount: { fontSize: 40, fontWeight: "800", color: colors.brandGreen, marginBottom: 20 },
  expiryRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  expiryText: { fontSize: 13, color: colors.warning, fontWeight: "600" },
  quoteActions: { flexDirection: "row", gap: 12, width: "100%" },
  quoteActionBtn: { flex: 1 },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  disabledBar: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.borderLight,
    borderRadius: 8,
  },
  disabledBarText: { fontSize: 14, fontWeight: "600", color: colors.subtext },
});
