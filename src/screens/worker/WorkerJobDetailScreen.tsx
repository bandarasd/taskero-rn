import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
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
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const [quotePrice, setQuotePrice] = useState("");
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

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
    const price = parseFloat(quotePrice);
    const duration = durationHours * 60 + durationMinutes;
    if (!price || isNaN(price)) {
      Alert.alert("Enter a valid price");
      return;
    }
    if (duration <= 0) {
      Alert.alert("Select an estimated duration");
      return;
    }
    setLoading(true);
    try {
      await submitQuote(taskId, price, duration, quoteNotes || undefined);
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
      if (status === "in_progress") {
        navigation.navigate("WorkerActiveJob", { taskId });
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update status");
    } finally {
      setLoading(false);
    }
  };

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
      {/* Hero Header */}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.bottom + 60}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, showStickyActions && { paddingBottom: 80 + insets.bottom }]}>
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

          {/* Job Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Job Details</Text>
            <InfoRow icon="📅" label="Scheduled" value={fmtDate(task.scheduled_at)} />
            <InfoRow icon="📍" label="Location" value={task.location_address ?? "—"} />
            <InfoRow icon="🏷" label="Category" value={task.category ?? "—"} />
            <InfoRow
              icon="💰"
              label="Base Price"
              value={task.base_price != null ? `Rs. ${task.base_price}` : "—"}
            />
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
                  Rs. {task.quoted_price ?? task.base_price ?? 0}
                </Text>
              </View>
            </>
          )}

          {/* Quote Form (pending only) — buttons live inside here */}
          {task.status === "pending" && (
            <>
              <SectionDivider />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Send Your Quote</Text>
                <View style={styles.quoteForm}>
                  {/* Quote Price */}
                  <View>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>Quote Price</Text>
                      <Text style={styles.requiredStar}> *</Text>
                    </View>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.inputPrefix}>Rs.</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={quotePrice}
                        onChangeText={setQuotePrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        placeholderTextColor={colors.subtext}
                      />
                    </View>
                  </View>

                  {/* Estimated Duration — +/- stepper, no nested scroll */}
                  <View>
                    <View style={styles.fieldLabelRow}>
                      <Text style={styles.fieldLabel}>Estimated Duration</Text>
                      <Text style={styles.requiredStar}> *</Text>
                    </View>
                    <View style={styles.durationStepper}>
                      {/* Hours */}
                      <View style={styles.stepperUnit}>
                        <Text style={styles.stepperLabel}>Hours</Text>
                        <View style={styles.stepperRow}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setDurationHours((h) => (h === 0 ? 23 : h - 1))}
                          >
                            <Text style={styles.stepperBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.stepperValue}>{String(durationHours).padStart(2, "0")}</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setDurationHours((h) => (h === 23 ? 0 : h + 1))}
                          >
                            <Text style={styles.stepperBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={styles.stepperColon}>:</Text>

                      {/* Minutes */}
                      <View style={styles.stepperUnit}>
                        <Text style={styles.stepperLabel}>Minutes</Text>
                        <View style={styles.stepperRow}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => {
                              const MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                              const idx = MINS.indexOf(durationMinutes);
                              setDurationMinutes(MINS[idx === 0 ? MINS.length - 1 : idx - 1]);
                            }}
                          >
                            <Text style={styles.stepperBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.stepperValue}>{String(durationMinutes).padStart(2, "0")}</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => {
                              const MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                              const idx = MINS.indexOf(durationMinutes);
                              setDurationMinutes(MINS[(idx + 1) % MINS.length]);
                            }}
                          >
                            <Text style={styles.stepperBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    {(durationHours > 0 || durationMinutes > 0) && (
                      <Text style={styles.durationSummary}>
                        {durationHours}h {durationMinutes}m selected
                      </Text>
                    )}
                  </View>

                  {/* Notes (optional) */}
                  <View>
                    <Text style={styles.fieldLabel}>Notes for Customer</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={quoteNotes}
                      onChangeText={setQuoteNotes}
                      placeholder="Add notes for the customer (optional)..."
                      multiline
                      placeholderTextColor={colors.subtext}
                    />
                  </View>

                  {/* Action buttons inside the form */}
                  <View style={[styles.buttonRow, { marginTop: 8, paddingBottom: Math.max(insets.bottom, 12) }]}>
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
});
