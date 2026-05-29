import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, View, TouchableOpacity, Linking, Platform } from "react-native";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePaymentSheet } from "@stripe/stripe-react-native";
import { getTaskById, respondToQuote, updateTaskStatus, cancelTask } from "../services/taskService";
import { createPaymentIntent, recordPayment, createOfflinePayment } from "../services/paymentService";
import { getUserById } from "../services/userService";
import { createThread } from "../services/chatService";
import { createReview, getTaskReviews } from "../services/reviewService";
import { useAuth } from "../store/authStore";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { TaskStatus } from "../types";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";
import { RateTaskerModal } from "../components/rating/RateTaskerModal";

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
  { key: "payment_pending", label: "Pay Now" },
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
  const [messageLoading, setMessageLoading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentConfirming, setPaymentConfirming] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const { dbUserId } = useAuth();

  const CUSTOMER_CANCEL_REASONS = [
    "Schedule conflict",
    "Found another worker",
    "No longer needed",
    "Pricing concern",
    "Other",
  ];

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
    refetchInterval: 30_000,
  });

  const { data: tasker } = useQuery({
    queryKey: ["user", task?.tasker_id],
    queryFn: () => getUserById(task!.tasker_id!),
    enabled: !!task?.tasker_id,
  });

  const { data: existingReviewsData } = useInfiniteQuery({
    queryKey: ["reviews", "task", taskId],
    queryFn: ({ pageParam = 1 }) => getTaskReviews(taskId, pageParam, 10),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: task?.status === "completed",
  });
  const existingReviews = existingReviewsData?.pages.flatMap((p) => p.data);

  const autoAcceptedRef = useRef(false);
  useEffect(() => {
    if (
      task &&
      task.status === "quoted" &&
      task.quoted_price != null &&
      task.base_price != null &&
      Number(task.quoted_price) === Number(task.base_price) &&
      !autoAcceptedRef.current
    ) {
      autoAcceptedRef.current = true;
      respondToQuote(task.id, true).then(() => {
        qc.invalidateQueries({ queryKey: ["task", taskId] });
        qc.invalidateQueries({ queryKey: ["tasks"] });
      }).catch((err) => {
        console.error("[auto-accept] respondToQuote failed:", err);
        Alert.alert("Error", "Could not auto-accept booking. Please accept manually.");
      });
    }
  }, [task?.status, task?.quoted_price, task?.base_price]);

  useEffect(() => {
    if (task?.status === "completed" && existingReviews !== undefined) {
      const hasReview = existingReviews.length > 0;
      setAlreadyRated(hasReview);
      if (!hasReview) setRatingModalVisible(true);
    }
  }, [task?.status, existingReviews]);

  const handleReviewSubmit = async (rating: number, tags: string[], body: string) => {
    const tagSuffix = tags.length ? ` [${tags.join(", ")}]` : "";
    const combined = (body + tagSuffix).trim();
    await createReview({ task_id: taskId, tasker_id: task!.tasker_id!, rating, body: combined });
    await qc.invalidateQueries({ queryKey: ["reviews", "task", taskId] });
  };

  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  const handleRespond = async (accepted: boolean) => {
    if (!accepted) {
      setRespondLoading(true);
      try {
        await respondToQuote(taskId, false);
        await qc.invalidateQueries({ queryKey: ["task", taskId] });
        await qc.invalidateQueries({ queryKey: ["tasks"] });
      } catch {
        Alert.alert("Error", "Could not decline quote");
      } finally {
        setRespondLoading(false);
      }
      return;
    }

    setRespondLoading(true);
    try {
      if (task!.payment_method === "card") {
        const { client_secret, payment_intent_id } = await createPaymentIntent(taskId, task!.quoted_price!);
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: client_secret,
          merchantDisplayName: "Taskero",
        });
        if (initError) {
          Alert.alert("Payment Error", initError.message);
          return;
        }
        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code !== "Canceled") Alert.alert("Payment Failed", presentError.message);
          return;
        }
        // Sequential: record payment first, then accept quote.
        // If recordPayment fails, quote is never accepted (safe to retry).
        await recordPayment({
          task_id: taskId,
          customer_id: dbUserId!,
          tasker_id: task!.tasker_id!,
          amount: task!.quoted_price!,
          stripe_payment_intent_id: payment_intent_id,
        });
        await respondToQuote(taskId, true);
      } else {
        await respondToQuote(taskId, true);
        await createOfflinePayment({
          task_id: taskId,
          customer_id: dbUserId!,
          tasker_id: task!.tasker_id!,
          amount: task!.quoted_price!,
        });
      }
      await qc.invalidateQueries({ queryKey: ["task", taskId] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch {
      Alert.alert("Error", "Could not accept quote");
    } finally {
      setRespondLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!dbUserId || !task?.tasker_id) return;
    setMessageLoading(true);
    try {
      const thread = await createThread(dbUserId, task.tasker_id, task.id);
      const name = tasker ? `${tasker.first_name ?? ""} ${tasker.last_name ?? ""}`.trim() || "Worker" : "Worker";
      navigation.navigate("Chat", { threadId: thread.id, otherUserName: name, taskId: task.id });
    } catch {
      Alert.alert("Error", "Could not open conversation");
    } finally {
      setMessageLoading(false);
    }
  };

  const handleConfirmCashPayment = async () => {
    setPaymentConfirming(true);
    try {
      const finalAmt = Number(task!.final_price ?? task!.quoted_price ?? task!.base_price ?? 0);
      await updateTaskStatus(taskId, "completed", finalAmt);
      setPaymentConfirmed(true);
      await qc.invalidateQueries({ queryKey: ["task", taskId] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch {
      Alert.alert("Error", "Could not confirm payment");
    } finally {
      setPaymentConfirming(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason) {
      Alert.alert("Please select a reason", "Choose a cancellation reason to proceed.");
      return;
    }
    setCancelling(true);
    try {
      await cancelTask(taskId, "customer", cancelReason);
      setCancelModalVisible(false);
      await qc.invalidateQueries({ queryKey: ["task", taskId] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.includes("409")) {
        Alert.alert("Already Updated", "This booking has already been updated by another party.");
        setCancelModalVisible(false);
        await qc.invalidateQueries({ queryKey: ["task", taskId] });
      } else {
        Alert.alert("Error", "Could not cancel this booking. Please try again.");
      }
    } finally {
      setCancelling(false);
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

        {/* Delay banner — shown when tasker is running late and customer hasn't responded */}
        {task.overrun_notified_at && !task.delay_response && (
          <TouchableOpacity
            style={styles.delayBanner}
            onPress={() => navigation.navigate("CustomerDelayResponse", { taskId: task.id })}
          >
            <Ionicons name="warning-outline" size={18} color="#92400E" />
            <Text style={styles.delayBannerText}>Your tasker is running late — tap to respond</Text>
            <Ionicons name="chevron-forward" size={16} color="#92400E" />
          </TouchableOpacity>
        )}

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
              onPress={handleMessage}
              disabled={messageLoading}
            >
              <Text style={styles.messageLinkText}>{messageLoading ? "Opening..." : "Message"}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.brandGreen} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Late penalty banner */}
        {(task.late_penalty_percent ?? 0) > 0 && (
          <View style={styles.latePenaltyBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.warning} />
            <Text style={styles.latePenaltyText}>
              Late visit penalty applied: {task.late_penalty_percent}% off your final price
              {task.late_penalty_amount != null ? ` (−Rs. ${Math.round(Number(task.late_penalty_amount))})` : ""}
            </Text>
          </View>
        )}

        {/* 4. Booking Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APPOINTMENT DETAILS</Text>
          <DetailRow
            icon="calendar-outline"
            label="Preferred date"
            value={fmtDate(task.scheduled_at)}
          />
          {task.time_preference && (
            <DetailRow
              icon="time-outline"
              label="Time of day"
              value={
                task.time_preference === "morning" ? "Morning (8 AM – 12 PM)" :
                task.time_preference === "afternoon" ? "Afternoon (12 PM – 5 PM)" :
                "Evening (5 PM – 8 PM)"
              }
            />
          )}
          {task.selected_tier_label && (
            <DetailRow
              icon="flash-outline"
              label="Visit speed"
              value={`${task.selected_tier_label} — within ${task.selected_tier_days ?? "?"} day${(task.selected_tier_days ?? 0) !== 1 ? "s" : ""}`}
            />
          )}
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

          {(task.surcharge_amount ?? 0) > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{task.selected_tier_label} surcharge</Text>
              <Text style={styles.priceValue}>+Rs. {task.surcharge_amount}</Text>
            </View>
          )}

          {task.quoted_price != null && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Quoted Price</Text>
              <Text style={styles.priceValue}>Rs. {task.quoted_price}</Text>
            </View>
          )}

          {task.status === "pending" && !task.quoted_price && (
            <Text style={styles.pendingQuoteText}>Pending quote from worker</Text>
          )}

          {(task.late_penalty_percent ?? 0) > 0 && task.final_price != null && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.warning }]}>Late penalty (−{task.late_penalty_percent}%)</Text>
              <Text style={[styles.priceValue, { color: colors.warning }]}>−Rs. {Math.round(Number(task.late_penalty_amount ?? 0))}</Text>
            </View>
          )}

          {task.final_price != null && (
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>Rs. {task.final_price}</Text>
            </View>
          )}
        </View>

        {/* 6a. Completion Payment Banner (if status === "completed") */}
        {(task.status === "payment_pending" || task.status === "completed") && (() => {
          const isCash = task.payment_method !== "card";
          const finalAmt = Number(task.final_price ?? task.quoted_price ?? task.base_price ?? 0);
          const quotedAmt = Number(task.quoted_price ?? task.base_price ?? 0);
          const hasExtra = finalAmt > quotedAmt;
          const extraAmt = finalAmt - quotedAmt;
          const alreadyConfirmed = paymentConfirmed || task.status === "completed";

          return (
            <View style={styles.completionBanner}>
              <View style={styles.completionBannerHeader}>
                <Ionicons name="checkmark-circle" size={22} color={colors.brandGreen} />
                <Text style={styles.completionBannerTitle}>
                  {isCash ? (alreadyConfirmed ? "Payment Confirmed" : "Confirm Your Payment") : "Payment Summary"}
                </Text>
              </View>

              <View style={styles.completionAmountRow}>
                <Text style={styles.completionBaseLabel}>
                  {isCash ? "Amount to pay" : "💳 Charged to card"}
                </Text>
                <Text style={styles.completionBaseAmt}>Rs. {quotedAmt.toLocaleString()}</Text>
              </View>

              {hasExtra && (
                <View style={styles.completionAmountRow}>
                  <Text style={styles.completionExtraLabel}>Extra charges</Text>
                  <Text style={styles.completionExtraAmt}>+ Rs. {extraAmt.toLocaleString()}</Text>
                </View>
              )}

              <View style={styles.completionTotalRow}>
                <Text style={styles.completionTotalLabel}>Total</Text>
                <Text style={styles.completionTotalAmt}>Rs. {finalAmt.toLocaleString()}</Text>
              </View>

              {isCash && !alreadyConfirmed && (
                <TouchableOpacity
                  style={[styles.confirmPayBtn, paymentConfirming && { opacity: 0.6 }]}
                  onPress={handleConfirmCashPayment}
                  disabled={paymentConfirming}
                >
                  <Text style={styles.confirmPayBtnText}>
                    {paymentConfirming ? "Confirming…" : `Confirm I Paid Rs. ${finalAmt.toLocaleString()} to ${workerName}`}
                  </Text>
                </TouchableOpacity>
              )}

              {isCash && alreadyConfirmed && (
                <View style={styles.paidConfirmedRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.brandGreen} />
                  <Text style={styles.paidConfirmedText}>Cash payment confirmed</Text>
                </View>
              )}

              {!isCash && (
                <View style={styles.paidConfirmedRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.brandGreen} />
                  <Text style={styles.paidConfirmedText}>Charged to your card on file</Text>
                </View>
              )}
            </View>
          );
        })()}

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
            <View style={styles.paymentMethodNote}>
              <Ionicons
                name={task.payment_method === "card" ? "card-outline" : "cash-outline"}
                size={14}
                color={colors.subtext}
              />
              <Text style={styles.paymentMethodNoteText}>
                {task.payment_method === "card"
                  ? "Card payment will be charged on acceptance"
                  : "Pay cash after the service is done"}
              </Text>
            </View>
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
          <View style={{ gap: 10 }}>
            <Button
              label="Message Worker"
              onPress={handleMessage}
              loading={messageLoading}
              fullWidth
            />
            {task.status === "accepted" && (
              <TouchableOpacity
                style={styles.cancelLink}
                onPress={() => { setCancelReason(""); setCancelModalVisible(true); }}
              >
                <Text style={styles.cancelLinkText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {task.status === "payment_pending" && (
          <View style={styles.disabledBar}>
            <Text style={[styles.disabledBarText, { color: colors.brandGreen }]}>
              Job done — scroll up to confirm payment
            </Text>
          </View>
        )}
        {task.status === "completed" && (
          <View style={{ gap: 8 }}>
            {alreadyRated ? (
              <View style={styles.reviewedPill}>
                <Ionicons name="checkmark-circle" size={16} color={colors.brandGreen} />
                <Text style={styles.reviewedPillText}>Reviewed</Text>
              </View>
            ) : (
              <Button
                label={`Rate ${workerName}`}
                onPress={() => setRatingModalVisible(true)}
                fullWidth
              />
            )}
            <Button
              label="Book Again"
              variant="outline"
              onPress={() => {
                if (task.gig_id) {
                  navigation.navigate("ServiceDetail", { gigId: task.gig_id });
                }
              }}
              fullWidth
            />
          </View>
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

      {/* Cancel Booking Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Cancel Booking?</Text>
            <Text style={styles.modalSubtitle}>
              {task?.payment_method === "card"
                ? "You'll receive an 80% refund. The remaining 20% is a non-refundable cancellation fee."
                : "Your booking will be cancelled. No charges apply."}
            </Text>
            <Text style={styles.modalReasonLabel}>Reason for cancellation</Text>
            {CUSTOMER_CANCEL_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonOption, cancelReason === r && styles.reasonOptionSelected]}
                onPress={() => setCancelReason(r)}
              >
                <Ionicons
                  name={cancelReason === r ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={cancelReason === r ? colors.danger : colors.subtext}
                />
                <Text style={[styles.reasonText, cancelReason === r && styles.reasonTextSelected]}>{r}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelling}
              >
                <Text style={styles.modalCancelBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!cancelReason || cancelling) && { opacity: 0.5 }]}
                onPress={handleCancelBooking}
                disabled={!cancelReason || cancelling}
              >
                <Text style={styles.modalConfirmBtnText}>
                  {cancelling ? "Cancelling…" : "Confirm Cancellation"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <RateTaskerModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleReviewSubmit}
        taskerName={workerName}
        taskerAvatar={tasker?.avatar_url}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollView: { flex: 1 },

  // Delay banner
  delayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  delayBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },

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
  reviewedPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.brandGreenLight,
  },
  reviewedPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brandGreen,
  },
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
  latePenaltyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: 0,
  },
  latePenaltyText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.warning, lineHeight: 18 },

  // Completion Payment Banner
  completionBanner: {
    margin: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.brandGreen + "40",
    shadowColor: colors.brandGreen,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  completionBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  completionBannerTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  completionAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  completionBaseLabel: { fontSize: 14, color: colors.subtext },
  completionBaseAmt: { fontSize: 14, fontWeight: "600", color: colors.text },
  completionExtraLabel: { fontSize: 14, color: colors.warning },
  completionExtraAmt: { fontSize: 14, fontWeight: "600", color: colors.warning },
  completionTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginBottom: 16,
  },
  completionTotalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  completionTotalAmt: { fontSize: 22, fontWeight: "800", color: colors.brandGreen },
  confirmPayBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmPayBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", textAlign: "center", paddingHorizontal: 8 },
  paidConfirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  paidConfirmedText: { fontSize: 13, color: colors.brandGreen, fontWeight: "600" },

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
  paymentMethodNote: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  paymentMethodNoteText: { fontSize: 12, color: colors.subtext, flex: 1 },
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

  // Cancel booking link
  cancelLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
    textDecorationLine: "underline",
  },

  // Cancel modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.subtext,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalReasonLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.subtext,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
  },
  reasonOptionSelected: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  reasonText: {
    fontSize: 15,
    color: colors.text,
  },
  reasonTextSelected: {
    fontWeight: "700",
    color: colors.danger,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: "center",
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
