import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createTask } from "../../services/taskService";
import { useAuth } from "../../store/authStore";
import { BookingToast, BookingToastHandle } from "../../components/booking/BookingToast";
import { StickyPriceCTA } from "../../components/booking/StickyPriceCTA";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";

type RouteProps = RouteProp<BookingFlowParamList, "Payment">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "card-outline" as const },
  { id: "cash", label: "Cash on Service", icon: "cash-outline" as const },
];

export function PaymentScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const {
    gigId, taskerId, address, latitude, longitude,
    scheduledAt, category, details, basePrice, notes, imageUris,
  } = route.params;
  const { dbUserId } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const toastRef = useRef<BookingToastHandle>(null);

  const handlePay = async () => {
    if (!dbUserId) return;
    setLoading(true);
    try {
      const task = await createTask({
        gig_id: gigId,
        tasker_id: taskerId,
        customer_id: dbUserId,
        title: category,
        category,
        location_address: address,
        location_latitude: latitude,
        location_longitude: longitude,
        scheduled_at: scheduledAt,
        base_price: basePrice,
        notes,
        details,
        status: "pending",
        payment_method: selectedMethod,
      } as any, imageUris);
      navigation.navigate("PaymentSuccess", { taskId: task.id, scheduledAt, address });
    } catch {
      toastRef.current?.show("Could not place booking. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Select payment method</Text>

        <View style={styles.orderCard}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>{category} service</Text>
            <Text style={styles.orderValue}>Rs. {basePrice.toLocaleString()} / hr</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Location</Text>
            <Text style={[styles.orderValue, styles.orderValueSmall]} numberOfLines={1}>{address}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.orderRow}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>Rs. {basePrice.toLocaleString()}</Text>
          </View>
          <View style={styles.amberNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
            <Text style={styles.amberNoteText}>
              Final amount confirmed after tasker quotes
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Payment Method</Text>
        {PAYMENT_METHODS.map((method) => {
          const selected = selectedMethod === method.id;
          return (
            <Pressable
              key={method.id}
              style={[styles.methodCard, selected && styles.methodCardSelected]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodLeft}>
                <View style={[styles.methodIcon, selected && styles.methodIconSelected]}>
                  <Ionicons name={method.icon} size={22} color={selected ? "#fff" : colors.subtext} />
                </View>
                <Text style={[styles.methodLabel, selected && styles.methodLabelSelected]}>
                  {method.label}
                </Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}

        <View style={styles.secureNote}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.subtext} />
          <Text style={styles.secureText}>Payments are secured & encrypted</Text>
        </View>
      </ScrollView>

      <StickyPriceCTA
        label="Place Booking"
        price={basePrice.toLocaleString()}
        onPress={handlePay}
        loading={loading}
      />

      <BookingToast ref={toastRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: { backgroundColor: colors.card, zIndex: 10 },
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
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  content: { padding: spacing.lg, paddingBottom: 140 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: spacing.xl },
  orderCard: {
    backgroundColor: colors.background ?? colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  orderLabel: { fontSize: 14, color: colors.subtext, flex: 1 },
  orderValue: { fontSize: 14, fontWeight: "600", color: colors.text, flex: 1, textAlign: "right" },
  orderValueSmall: { fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.sm },
  totalLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 16, fontWeight: "800", color: colors.brandGreen },
  amberNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  amberNoteText: { fontSize: 12, fontWeight: "600", color: colors.warning, flex: 1 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  methodCardSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: `${colors.brandGreen}08`,
  },
  methodLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconSelected: { backgroundColor: colors.brandGreen },
  methodLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
  methodLabelSelected: { color: colors.brandGreen },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.brandGreen },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandGreen },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  secureText: { fontSize: 12, color: colors.subtext },
});
