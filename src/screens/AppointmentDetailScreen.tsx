import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getTaskById, respondToQuote } from "../services/taskService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Avatar } from "../components/common/Avatar";
import { TaskStatusBadge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type RouteProps = RouteProp<CustomerStackParamList, "AppointmentDetail">;
type Nav = NativeStackNavigationProp<CustomerStackParamList>;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "Not scheduled";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function fmtTime(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function AppointmentDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { taskId } = route.params;
  const qc = useQueryClient();
  const [respondLoading, setRespondLoading] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
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

  if (isLoading || !task) return <LoadingSpinner />;

  const workerName = task.tasker
    ? `${task.tasker.first_name ?? ""} ${task.tasker.last_name ?? ""}`.trim()
    : "Worker";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status banner */}
      <View style={styles.statusBanner}>
        <Text style={styles.serviceTitle}>{task.gig?.title ?? task.title ?? "Service"}</Text>
        <TaskStatusBadge status={task.status} />
      </View>

      {/* Worker card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Provider</Text>
        <View style={styles.workerRow}>
          <Avatar uri={task.tasker?.avatar_url} name={workerName} size={48} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.workerName}>{workerName}</Text>
          </View>
          <Button
            label="Message"
            onPress={() =>
              navigation.navigate("Chat", {
                threadId: task.id,
                otherUserName: workerName,
              })
            }
            variant="outline"
            size="sm"
            fullWidth={false}
          />
        </View>
      </View>

      {/* Details card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Booking Details</Text>
        <Row label="Category" value={task.category ?? "—"} />
        <Row label="Date" value={fmtDate(task.scheduled_at)} />
        <Row label="Time" value={fmtTime(task.scheduled_at) || "—"} />
        <Row label="Location" value={task.location_address ?? "—"} />
        {task.notes ? <Row label="Notes" value={task.notes} /> : null}
      </View>

      {/* Pricing card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pricing</Text>
        <Row label="Base Price" value={task.base_price != null ? `$${task.base_price}` : "—"} />
        {task.quoted_price != null && (
          <Row label="Quoted Price" value={`$${task.quoted_price}`} />
        )}
        {task.final_price != null && (
          <Row label="Final Price" value={`$${task.final_price}`} />
        )}
      </View>

      {/* Quote response (if pending quote) */}
      {task.status === "quoted" && (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>💬 You have a quote!</Text>
          <Text style={styles.quoteAmount}>${task.quoted_price}</Text>
          <Text style={styles.quoteNote}>Accept to confirm this booking.</Text>
          <View style={styles.quoteActions}>
            <Button
              label="Decline"
              onPress={() => handleRespond(false)}
              variant="outline"
              style={{ flex: 1 }}
              disabled={respondLoading}
            />
            <Button
              label="Accept"
              onPress={() => handleRespond(true)}
              style={{ flex: 1 }}
              loading={respondLoading}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48 },
  statusBanner: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceTitle: { fontSize: 16, fontWeight: "700", color: colors.text, flex: 1, marginRight: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.subtext, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLabel: { fontSize: 14, color: colors.subtext },
  rowValue: { fontSize: 14, fontWeight: "500", color: colors.text, maxWidth: "60%", textAlign: "right" },
  workerRow: { flexDirection: "row", alignItems: "center" },
  workerName: { fontSize: 16, fontWeight: "600", color: colors.text },
  quoteCard: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brandGreen,
    padding: 20,
    alignItems: "center",
    marginBottom: 14,
  },
  quoteTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 8 },
  quoteAmount: { fontSize: 36, fontWeight: "700", color: colors.brandGreen, marginBottom: 4 },
  quoteNote: { fontSize: 13, color: colors.subtext, marginBottom: 16 },
  quoteActions: { flexDirection: "row", gap: 12, alignSelf: "stretch" },
});
