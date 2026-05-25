import React, { useState } from "react";
import {
  Alert,
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getTaskById, updateTaskStatus } from "../../services/taskService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { SwipeToConfirm } from "../../components/common/SwipeToConfirm";
import { Button } from "../../components/common/Button";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type RouteProps = RouteProp<WorkerStackParamList, "WorkerJobCompletion">;
type Nav = NativeStackNavigationProp<WorkerStackParamList>;

type ExtraCharge = { id: string; description: string; amount: number };

function fmt(n: number) {
  return `Rs. ${Math.round(n).toLocaleString()}`;
}

export function WorkerJobCompletionScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const { taskId } = route.params;

  const [extras, setExtras] = useState<ExtraCharge[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetDesc, setSheetDesc] = useState("");
  const [sheetAmount, setSheetAmount] = useState("");
  const [confirming, setConfirming] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

  if (isLoading || !task) return <LoadingSpinner />;

  const isCash = task.payment_method !== "card";
  // Parse to number explicitly to avoid string concatenation
  const baseAmount = Number(task.quoted_price ?? task.base_price ?? 0);
  const extrasTotal = extras.reduce((sum, e) => sum + e.amount, 0);
  const total = baseAmount + extrasTotal;

  const addExtra = () => {
    const amt = parseFloat(sheetAmount);
    if (!sheetDesc.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid", "Please enter a description and a valid amount.");
      return;
    }
    setExtras((prev) => [
      ...prev,
      { id: Date.now().toString(), description: sheetDesc.trim(), amount: amt },
    ]);
    setSheetDesc("");
    setSheetAmount("");
    setSheetVisible(false);
  };

  const removeExtra = (id: string) => setExtras((prev) => prev.filter((e) => e.id !== id));

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await updateTaskStatus(taskId, "completed", total);
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["worker-tasks"] });
      setConfirming(false);
      navigation.getParent()?.navigate("JobsTab" as never);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not complete job");
      setConfirming(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Green header */}
      <LinearGradient
        colors={[colors.brandGreen, "#009E53"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={32} color={colors.brandGreen} />
        </View>
        <Text style={styles.headerTitle}>Job Complete!</Text>
        <Text style={styles.headerSubtitle}>
          {isCash ? "Collect payment from customer" : "Review payment summary"}
        </Text>

        {/* Payment method badge */}
        <View style={styles.methodBadge}>
          <Ionicons
            name={isCash ? "cash-outline" : "card-outline"}
            size={14}
            color="#fff"
          />
          <Text style={styles.methodBadgeText}>
            {isCash ? "Cash Payment" : "Card Payment"}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Breakdown card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PAYMENT BREAKDOWN</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              {isCash ? "Quoted amount" : "💳 Charged to card"}
            </Text>
            <Text style={styles.rowValue}>{fmt(baseAmount)}</Text>
          </View>

          {extras.map((e) => (
            <View key={e.id} style={styles.row}>
              <Text style={styles.extraLabel}>+ {e.description}</Text>
              <Text style={styles.extraValue}>{fmt(e.amount)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {isCash ? "Collect total" : "Total"}
            </Text>
            <Text style={styles.totalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Card extra note */}
        {!isCash && extras.length > 0 && (
          <View style={styles.infoStrip}>
            <Ionicons name="information-circle-outline" size={16} color="#6366F1" />
            <Text style={styles.infoStripText}>
              Collect Rs. {Math.round(extrasTotal).toLocaleString()} extra in cash from the customer.
            </Text>
          </View>
        )}

        {/* Extras list */}
        {extras.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>EXTRA CHARGES</Text>
            {extras.map((e) => (
              <View key={e.id} style={styles.extraRow}>
                <Ionicons name="add-circle-outline" size={16} color={colors.subtext} style={{ marginRight: 8 }} />
                <Text style={styles.extraRowDesc}>{e.description}</Text>
                <Text style={styles.extraRowAmt}>{fmt(e.amount)}</Text>
                <TouchableOpacity onPress={() => removeExtra(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add extra charge */}
        <TouchableOpacity style={styles.addExtraBtn} onPress={() => setSheetVisible(true)}>
          <Ionicons name="add-circle-outline" size={18} color={colors.brandGreen} />
          <Text style={styles.addExtraBtnText}>Add Extra Charge</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isCash ? (
          <>
            <View style={styles.collectRow}>
              <Text style={styles.collectLabel}>Collect from customer</Text>
              <Text style={styles.collectAmt}>{fmt(total)}</Text>
            </View>
            <SwipeToConfirm
              label="Swipe to Confirm Collection"
              onConfirm={handleConfirm}
              loading={confirming}
              variant="green"
            />
          </>
        ) : (
          <Button
            label={`Mark as Done  ·  ${fmt(total)}`}
            onPress={handleConfirm}
            loading={confirming}
            fullWidth
          />
        )}
      </View>

      {/* Add extra charge sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setSheetVisible(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Extra Charge</Text>
            <Text style={styles.sheetSubtitle}>Materials, travel, or any additional cost</Text>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Extra materials, Travel fee"
              placeholderTextColor={colors.subtext}
              value={sheetDesc}
              onChangeText={setSheetDesc}
            />

            <Text style={styles.inputLabel}>Amount (Rs.)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.subtext}
              value={sheetAmount}
              onChangeText={setSheetAmount}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.sheetAddBtn} onPress={addExtra}>
              <Text style={styles.sheetAddBtnText}>Add Charge</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F7" },

  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 14 },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  methodBadgeText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  scroll: { flex: 1 },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: radius.lg,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rowLabel: { fontSize: 15, color: colors.text, fontWeight: "500" },
  rowValue: { fontSize: 15, color: colors.text, fontWeight: "600" },
  extraLabel: { fontSize: 14, color: colors.subtext, flex: 1 },
  extraValue: { fontSize: 14, color: colors.subtext, fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 14 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  totalValue: { fontSize: 24, fontWeight: "800", color: colors.brandGreen },

  infoStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(99,102,241,0.08)",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radius.md,
    padding: 14,
  },
  infoStripText: { fontSize: 13, color: "#4F46E5", flex: 1, lineHeight: 18 },

  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F7",
  },
  extraRowDesc: { flex: 1, fontSize: 14, color: colors.text },
  extraRowAmt: { fontSize: 14, fontWeight: "600", color: colors.text, marginRight: 10 },

  addExtraBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderStyle: "dashed",
    backgroundColor: "#fff",
  },
  addExtraBtnText: { fontSize: 14, fontWeight: "600", color: colors.brandGreen },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingHorizontal: 20,
    paddingTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  collectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  collectLabel: { fontSize: 13, color: colors.subtext, fontWeight: "500" },
  collectAmt: { fontSize: 22, fontWeight: "800", color: colors.text },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheetWrap: { position: "absolute", bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: "#E5E5EA",
    borderRadius: 2, alignSelf: "center", marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, color: colors.subtext, marginBottom: 20 },
  inputLabel: {
    fontSize: 12, fontWeight: "600", color: colors.subtext,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1.5, borderColor: "#E5E5EA", borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: colors.text, marginBottom: 16,
  },
  sheetAddBtn: {
    backgroundColor: colors.brandGreen,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  sheetAddBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
