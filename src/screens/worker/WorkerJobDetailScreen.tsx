import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
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
import { getTaskById, submitQuote, respondToQuote, updateTaskStatus, getTaskConflicts } from "../../services/taskService";
import { getUserById } from "../../services/userService";
import { createThread } from "../../services/chatService";
import { Avatar } from "../../components/common/Avatar";
import { TaskStatusBadge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { SwipeToConfirm } from "../../components/common/SwipeToConfirm";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { useCategoryByName } from "../../hooks/useCategories";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type RouteProps = RouteProp<WorkerStackParamList, "WorkerJobDetail">;
type Nav = NativeStackNavigationProp<WorkerStackParamList>;


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

function SkeletonBox({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius.md, backgroundColor: colors.sectionHeader, opacity: anim }, style]}
    />
  );
}

function CustomerPhotosSkeleton() {
  return (
    <>
      <SectionDivider />
      <View style={styles.section}>
        <SkeletonBox width={120} height={12} style={{ marginBottom: 16 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
          {[0, 1, 2].map((i) => (
            <SkeletonBox key={i} width={120} height={120} style={{ marginRight: 10 }} />
          ))}
        </ScrollView>
      </View>
    </>
  );
}


const STATUS_STRIP_CONFIG: Record<string, { bg: string; dot: string; msg: string }> = {
  pending: { bg: colors.warningLight, dot: colors.warning, msg: "Review and accept this job" },
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
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [slaCountdown, setSlaCountdown] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

  const { data: conflictsData } = useQuery({
    queryKey: ["task-conflicts", taskId],
    queryFn: () => getTaskConflicts(taskId),
    enabled: task?.status === "pending",
  });
  const conflictCount = conflictsData?.count ?? 0;

  // SLA countdown: pending tasks must be responded to within 24h of creation
  useEffect(() => {
    if (task?.status !== "pending" || !task?.created_at) return;
    const update = () => {
      const expiresAt = new Date(task.created_at!).getTime() + 24 * 60 * 60 * 1000;
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setSlaCountdown("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setSlaCountdown(`${h}h ${m}m`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [task?.status, task?.created_at]);

  const { data: categoryData } = useCategoryByName(task?.category);

  const { data: customer } = useQuery({
    queryKey: ["user", task?.customer_id],
    queryFn: () => getUserById(task!.customer_id),
    enabled: !!task?.customer_id,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["task", taskId] });

  // Redirect to active job timer if task is already in_progress
  useEffect(() => {
    if (task?.status === "in_progress") {
      navigation.navigate("WorkerActiveJob", { taskId });
    }
  }, [task?.status]);

  const handleMessage = async () => {
    if (!task?.customer_id || !dbUserId) return;
    setMessageLoading(true);
    try {
      const displayName = customer
        ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Customer"
        : "Customer";
      const thread = await createThread(task.customer_id, dbUserId, taskId);
      navigation.navigate("WorkerChat", { threadId: thread.id, otherUserName: displayName, taskId });
    } catch {
      Alert.alert("Error", "Could not open conversation");
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSubmitQuote = async () => {
    const price = parseFloat(quotePrice) || expectedTotal;
    if (!price) {
      Alert.alert("No base price set for this job");
      return;
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    setLoading(true);
    try {
      const isDirectAccept = price === expectedTotal;
      await submitQuote(taskId, price, quoteNotes || undefined, expiresAt, isDirectAccept);
      if (isDirectAccept) {
        await respondToQuote(taskId, true, true);
      }
      await refresh();
      setQuoteModalVisible(false);
      setQuotePrice("");
      setQuoteNotes("");
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
      if (status === "in_progress") {
        navigation.navigate("WorkerActiveJob", { taskId });
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update status");
    } finally {
      setLoading(false);
    }
  };

  const expectedTotal = Number(task?.base_price ?? 0) + Number(task?.surcharge_amount ?? 0);

  if (isLoading || !task) return (
    <View style={styles.mainContainer}>
      <View style={[styles.heroWrapper, { backgroundColor: colors.sectionHeader }]} />
      <View style={[styles.statusStrip, { backgroundColor: colors.sectionHeader }]} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.customerRow}>
            <SkeletonBox width={52} height={52} style={{ borderRadius: 26 }} />
            <View style={[styles.customerInfo, { gap: 8 }]}>
              <SkeletonBox width={140} height={14} />
              <SkeletonBox width={80} height={12} />
            </View>
          </View>
        </View>
        <SectionDivider />
        <View style={styles.section}>
          <SkeletonBox width={90} height={12} style={{ marginBottom: 16 }} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.infoRow, { marginBottom: 16 }]}>
              <SkeletonBox width={120} height={12} />
              <SkeletonBox width={100} height={12} />
            </View>
          ))}
        </View>
        <CustomerPhotosSkeleton />
      </ScrollView>
    </View>
  );

  const displayCustomer = customer || task.customer;
  const customerName = displayCustomer
    ? `${displayCustomer.first_name ?? ""} ${displayCustomer.last_name ?? ""}`.trim()
    : "Customer";

  const category = (task.category || "General") as string;
  const toUrl = (a: unknown) => typeof a === "string" ? a : (a as { url?: string })?.url ?? null;
  const gigAttachments: unknown[] = Array.isArray(task.gig_attachments)
    ? task.gig_attachments
    : task.gig_attachments
    ? [task.gig_attachments]
    : [];
  const imageUri =
    toUrl(gigAttachments[0]) ||
    categoryData?.image_url ||
    null;

  const statusConfig = STATUS_STRIP_CONFIG[task.status] || STATUS_STRIP_CONFIG.pending;

  const showStickyActions = ["accepted", "in_progress"].includes(task.status);
  const customerPhotos: string[] = Array.isArray(task.attachments)
    ? (task.attachments as unknown[]).map(toUrl).filter(Boolean) as string[]
    : [];
  const rawDetails = task.details
    ? typeof task.details === "string"
      ? (() => { try { return JSON.parse(task.details); } catch { return {}; } })()
      : task.details
    : {};
  const serviceDetails: [string, any][] = Object.entries(rawDetails).filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <View style={styles.mainContainer}>
      {/* Accept Quote Modal */}
      <Modal
        visible={quoteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity style={styles.modalBackdropTouch} activeOpacity={1} onPress={() => setQuoteModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Accept Job</Text>
            {expectedTotal > 0 && (
              <View style={styles.modalBasePriceRow}>
                <Text style={styles.modalBasePriceLabel}>Estimated total</Text>
                <Text style={styles.modalBasePriceValue}>Rs. {expectedTotal}</Text>
              </View>
            )}
            <Text style={styles.modalFieldLabel}>Custom price (optional)</Text>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.inputPrefix}>Rs.</Text>
              <TextInput
                style={styles.priceInput}
                value={quotePrice}
                onChangeText={setQuotePrice}
                placeholder={expectedTotal > 0 ? String(expectedTotal) : "0.00"}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.subtext}
              />
            </View>
            <Text style={styles.modalHint}>Leave blank to accept the estimated price</Text>
            <Text style={[styles.modalFieldLabel, { marginTop: 12 }]}>Notes for customer (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={quoteNotes}
              onChangeText={setQuoteNotes}
              placeholder="Add any notes..."
              multiline
              placeholderTextColor={colors.subtext}
            />
            <View style={[styles.buttonRow, { marginTop: 16 }]}>
              <Button
                label="Cancel"
                onPress={() => setQuoteModalVisible(false)}
                variant="outline"
                style={{ flex: 1 }}
                disabled={loading}
              />
              <Button
                label="Confirm"
                onPress={handleSubmitQuote}
                style={{ flex: 1 }}
                loading={loading}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.bottom + 60}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, showStickyActions && { paddingBottom: 80 + insets.bottom }]}>
          {/* Hero Header — scrolls with content */}
          <View style={styles.heroWrapper}>
            <ImageBackground source={{ uri: imageUri }} style={styles.heroImage}>
              <View style={styles.heroOverlay}>
                <View style={styles.heroBottomContent}>
                  <Text style={styles.heroTitle}>{task.gig_title ?? task.title ?? "Service Request"}</Text>
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
          {/* Customer Section */}
          <View style={styles.section}>
            <View style={styles.customerRow}>
              <Avatar uri={displayCustomer?.avatar_url} name={customerName} size={52} />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customerName}</Text>
                <TouchableOpacity onPress={handleMessage} disabled={messageLoading}>
                  <Text style={styles.messageLink}>
                    {messageLoading ? "Opening..." : "Message →"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <SectionDivider />

          {/* Late penalty banner */}
          {(task.late_penalty_percent ?? 0) > 0 && (
            <View style={styles.latePenaltyBanner}>
              <Text style={styles.latePenaltyText}>
                ⚠️ Late penalty: {task.late_penalty_percent}% will be deducted from your earnings
                {task.late_penalty_amount != null ? ` (−Rs. ${Math.round(Number(task.late_penalty_amount))})` : ""}
              </Text>
            </View>
          )}

          {/* SLA countdown for pending tasks */}
          {task.status === "pending" && slaCountdown !== "" && (
            <View style={styles.slaBar}>
              <Text style={styles.slaText}>
                ⏱ Respond within {slaCountdown === "Expired" ? "— request expired" : slaCountdown}
              </Text>
            </View>
          )}

          {/* Conflict warning: another user booked the same slot */}
          {task.status === "pending" && conflictCount > 0 && (
            <View style={styles.conflictBanner}>
              <Text style={styles.conflictText}>
                ⚠️ {conflictCount === 1 ? "Another user has" : `${conflictCount} other users have`} also requested this slot. Accepting will automatically decline {conflictCount === 1 ? "their" : "those"} request{conflictCount > 1 ? "s" : ""}.
              </Text>
            </View>
          )}

          {/* Job Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Job Details</Text>
            {task.time_preference && (
              <InfoRow
                icon="🕐"
                label="Time of day"
                value={
                  task.time_preference === "morning" ? "Morning (8 AM – 12 PM)" :
                  task.time_preference === "afternoon" ? "Afternoon (12 PM – 5 PM)" :
                  "Evening (5 PM – 8 PM)"
                }
              />
            )}
            {task.selected_tier_label && (
              <InfoRow
                icon="⚡"
                label="Visit speed"
                value={`${task.selected_tier_label} — within ${task.selected_tier_days ?? "?"} day${(task.selected_tier_days ?? 0) !== 1 ? "s" : ""}`}
              />
            )}
            {task.promised_visit_date && (
              <InfoRow
                icon="🚩"
                label="Must visit by"
                value={(() => {
                  const raw = task.promised_visit_date!;
                  const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00");
                  return isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
                })()}
              />
            )}
            <InfoRow icon="📍" label="Location" value={task.location_address ?? "—"} />
            <InfoRow icon="🏷" label="Category" value={task.category ?? "—"} />
            <InfoRow
              icon="💰"
              label="Base Price"
              value={task.base_price != null ? `Rs. ${task.base_price}` : "—"}
            />
            {(task.surcharge_amount ?? 0) > 0 && (
              <InfoRow
                icon="⚡"
                label={`${task.selected_tier_label ?? "Speed"} surcharge`}
                value={`+Rs. ${task.surcharge_amount}`}
              />
            )}
          </View>

          {/* Service Details (customer-selected fields) */}
          {serviceDetails.length > 0 && (
            <>
              <SectionDivider />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Service Details</Text>
                {serviceDetails.map(([k, v]) => (
                  <InfoRow
                    key={k}
                    icon="📋"
                    label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={String(v)}
                  />
                ))}
              </View>
            </>
          )}

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

          {/* Customer Photos */}
          {customerPhotos.length > 0 && (
            <>
              <SectionDivider />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Customer Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
                  {customerPhotos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.attachmentThumb} />
                  ))}
                </ScrollView>
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
                  Rs. {task.quoted_price ?? expectedTotal}
                </Text>
              </View>
            </>
          )}

          {/* Pending actions */}
          {task.status === "pending" && (
            <>
              <SectionDivider />
              <View style={styles.section}>
                {task.base_price != null && (
                  <Text style={styles.basePriceHint}>Base price: Rs. {task.base_price}</Text>
                )}
                <View style={[styles.buttonRow, { marginTop: 8, paddingBottom: Math.max(insets.bottom, 12) }]}>
                  <Button
                    label="Decline"
                    onPress={() => handleStatus("declined")}
                    variant="outline"
                    style={{ flex: 1 }}
                    disabled={loading}
                  />
                  <Button
                    label="Accept"
                    onPress={() => setQuoteModalVisible(true)}
                    style={{ flex: 1 }}
                    disabled={loading}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky bottom bar for accepted / in_progress */}
      {(task.status === "accepted" || task.status === "in_progress") && (
        <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {task.status === "accepted" && (
            <SwipeToConfirm
              label="Swipe to Start Job"
              onConfirm={() => handleStatus("in_progress")}
              loading={loading}
            />
          )}
          {task.status === "in_progress" && (
            <Button
              label="Resume Active Job"
              onPress={() => navigation.navigate("WorkerActiveJob", { taskId })}
              fullWidth
            />
          )}
        </View>
      )}
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
    paddingBottom: 100,
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
  latePenaltyBanner: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: 0,
  },
  latePenaltyText: { fontSize: 13, fontWeight: "600", color: colors.warning, lineHeight: 18 },
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
  durationInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  photosRow: {
    marginTop: 4,
  },
  attachmentThumb: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    marginRight: 10,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.subtext,
  },
  requiredStar: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.danger,
  },
  durationStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 16,
    gap: 8,
  },
  stepperUnit: {
    flex: 1,
    alignItems: "center",
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 24,
  },
  stepperValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    minWidth: 44,
    textAlign: "center",
  },
  stepperColon: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 20,
  },
  durationSummary: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 8,
    textAlign: "center",
  },
  conflictBanner: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  conflictText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
    lineHeight: 18,
  },
  slaBar: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radius.sm,
  },
  slaText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.warning,
  },
  basePriceHint: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.subtext,
    marginBottom: 4,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  modalBasePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modalBasePriceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brandGreen,
  },
  modalBasePriceValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandGreen,
  },
  modalFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.subtext,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 6,
    marginBottom: 4,
  },
});
