import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTaskById, submitQuote, updateTaskStatus } from "../../services/taskService";
import { getUserById } from "../../services/userService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Avatar } from "../../components/common/Avatar";
import { TaskStatusBadge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type RouteProps = RouteProp<WorkerStackParamList, "WorkerJobDetail">;
type Nav = NativeStackNavigationProp<WorkerStackParamList>;

const CATEGORY_IMAGES: Record<string, string> = {
  Cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6954?q=80&w=800&auto=format&fit=crop",
  Plumbing: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
  Laundry: "https://images.unsplash.com/photo-1545173168-9f1947eebb0f?q=80&w=800&auto=format&fit=crop",
  Painting: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800&auto=format&fit=crop",
  Repairing: "https://images.unsplash.com/photo-1581244276891-83393a899971?q=80&w=800&auto=format&fit=crop",
  Electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop",
  Assembly: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=800&auto=format&fit=crop",
  Carpentry: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop",
  Moving: "https://images.unsplash.com/photo-1584931423298-c576fda54bd2?q=80&w=800&auto=format&fit=crop",
  Gardening: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=800&auto=format&fit=crop",
  General: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop",
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SectionDivider() {
  return <View style={styles.divider} />;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STRIP_CONFIG: Record<string, { bg: string; dot: string; msg: string }> = {
  pending: { bg: colors.warningLight, dot: colors.warning, msg: "Awaiting your quote" },
  quoted: { bg: colors.warningLight, dot: colors.warning, msg: "Quote sent — waiting for approval" },
  accepted: { bg: colors.infoLight, dot: colors.info, msg: "Ready to begin" },
  in_progress: { bg: colors.brandGreenLight, dot: colors.brandGreen, msg: "Job underway" },
  completed: { bg: colors.successLight, dot: colors.success, msg: "Job complete" },
  canceled: { bg: colors.dangerLight, dot: colors.danger, msg: "Job was cancelled" },
  declined: { bg: colors.dangerLight, dot: colors.danger, msg: "You declined this job" },
};

export function WorkerJobDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { taskId } = route.params;
  const qc = useQueryClient();
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

  const { data: customer } = useQuery({
    queryKey: ["user", task?.customer_id],
    queryFn: () => getUserById(task!.customer_id),
    enabled: !!task?.customer_id,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["task", taskId] });

  const handleSubmitQuote = async () => {
    const price = parseFloat(quotePrice);
    if (!price || isNaN(price)) {
      Alert.alert("Enter a valid price");
      return;
    }
    setLoading(true);
    try {
      await submitQuote(taskId, price, quoteNotes || undefined);
      await refresh();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not submit quote");
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (status: "accepted" | "in_progress" | "completed" | "declined") => {
    setLoading(true);
    try {
      await updateTaskStatus(taskId, status);
      await refresh();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update status");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !task) return <LoadingSpinner />;

  const displayCustomer = customer || task.customer;
  const customerName = displayCustomer
    ? `${displayCustomer.first_name ?? ""} ${displayCustomer.last_name ?? ""}`.trim()
    : "Customer";

  const category = (task.category || task.gig?.category || "General") as string;
  const imageUri =
    task.attachments?.[0] ||
    task.gig?.attachments?.[0] ||
    CATEGORY_IMAGES[category] ||
    CATEGORY_IMAGES.General;

  const statusConfig = STATUS_STRIP_CONFIG[task.status] || STATUS_STRIP_CONFIG.pending;

  const showStickyActions = ["pending", "accepted", "in_progress"].includes(task.status);

  return (
    <View style={styles.mainContainer}>
      {/* Hero Header */}
      <View style={styles.heroWrapper}>
        <ImageBackground source={{ uri: imageUri }} style={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroBottomContent}>
              <Text style={styles.heroTitle}>{task.gig?.title ?? task.title ?? "Service Request"}</Text>
              <TaskStatusBadge status={task.status} />
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Status Strip */}
      <View style={[styles.statusStrip, { backgroundColor: statusConfig.bg }]}>
        <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
        <Text style={styles.statusMessage}>{statusConfig.msg}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Customer Section */}
          <View style={styles.section}>
            <View style={styles.customerRow}>
              <Avatar uri={displayCustomer?.avatar_url} name={customerName} size={52} />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customerName}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("WorkerChat", {
                      threadId: taskId,
                      otherUserName: customerName,
                    })
                  }
                >
                  <Text style={styles.messageLink}>Message →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <SectionDivider />

          {/* Job Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Job Details</Text>
            <InfoRow icon="📅" label="Scheduled" value={fmtDate(task.scheduled_at)} />
            <InfoRow icon="📍" label="Location" value={task.location_address ?? "—"} />
            <InfoRow icon="🏷" label="Category" value={task.category ?? "—"} />
            <InfoRow
              icon="💲"
              label="Base Price"
              value={task.base_price != null ? `$${task.base_price}` : "—"}
            />
          </View>

          {/* Notes Section */}
          {task.notes && (
            <>
              <SectionDivider />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Notes</Text>
                <View style={styles.notesBlock}>
                  <Text style={styles.notesText}>{task.notes}</Text>
                </View>
              </View>
            </>
          )}

          {/* Earnings Section (non-pending) */}
          {task.status !== "pending" && (
            <>
              <SectionDivider />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {task.status === "quoted" ? "Your Quote" : "Your Earnings"}
                </Text>
                <Text style={styles.earningsValue}>
                  ${task.quoted_price ?? task.base_price ?? 0}
                </Text>
              </View>
            </>
          )}

          {/* Quote Form (pending only) */}
          {task.status === "pending" && (
            <>
              <SectionDivider />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Send Your Quote</Text>
                <View style={styles.quoteForm}>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.inputPrefix}>$</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={quotePrice}
                      onChangeText={setQuotePrice}
                      placeholder="Price"
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.subtext}
                    />
                  </View>
                  <TextInput
                    style={styles.notesInput}
                    value={quoteNotes}
                    onChangeText={setQuoteNotes}
                    placeholder="Add notes for the customer (optional)..."
                    multiline
                    placeholderTextColor={colors.subtext}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Sticky Bottom Action Bar */}
        {showStickyActions && (
          <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {task.status === "pending" && (
              <View style={styles.buttonRow}>
                <Button
                  label="Decline"
                  onPress={() => handleStatus("declined")}
                  variant="outline"
                  style={{ flex: 1 }}
                  disabled={loading}
                />
                <Button
                  label="Send Quote"
                  onPress={handleSubmitQuote}
                  style={{ flex: 1 }}
                  loading={loading}
                />
              </View>
            )}

            {task.status === "accepted" && (
              <Button
                label="Start Job"
                onPress={() => handleStatus("in_progress")}
                loading={loading}
                fullWidth
              />
            )}

            {task.status === "in_progress" && (
              <Button
                label="Mark as Complete"
                onPress={() => handleStatus("completed")}
                loading={loading}
                fullWidth
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroWrapper: {
    height: 220,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    padding: 20,
  },
  heroBottomContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginRight: 12,
  },
  statusStrip: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    backgroundColor: "#fff",
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  divider: {
    height: 8,
    backgroundColor: colors.sectionHeader,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  messageLink: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brandGreen,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.subtext,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  notesBlock: {
    backgroundColor: colors.sectionHeader,
    padding: 12,
    borderRadius: radius.md,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: "italic",
    lineHeight: 20,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.brandGreen,
  },
  quoteForm: {
    gap: 12,
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 52,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.brandGreen,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  notesInput: {
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 80,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: "top",
  },
  stickyBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
});
