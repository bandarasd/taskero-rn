import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getWorkerCertifications, WorkerCertification } from "../../services/certificationService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { useCategories } from "../../hooks/useCategories";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

type Status = WorkerCertification["status"] | "not_submitted";

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { icon: any; label: string; color: string; bg: string }> = {
    approved: { icon: "checkmark-circle", label: "Approved", color: colors.success, bg: colors.successLight },
    pending: { icon: "time", label: "Under Review", color: colors.warning, bg: colors.warningLight },
    rejected: { icon: "close-circle", label: "Rejected", color: colors.danger, bg: colors.dangerLight },
    not_submitted: { icon: "ellipse-outline", label: "Not Applied", color: colors.subtext, bg: colors.sectionHeader },
  };
  const s = map[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={13} color={s.color} />
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}


export function WorkerCertificationsScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();

  const { data: allCategories = [] } = useCategories();
  const certifiedCategories = allCategories.filter((c) => c.requires_certification);

  const { data: certifications = [], isLoading, refetch } = useQuery({
    queryKey: ["worker-certs", dbUserId],
    queryFn: () => getWorkerCertifications(dbUserId!),
    enabled: !!dbUserId,
  });

  const certMap = Object.fromEntries(certifications.map((c) => [c.category, c]));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text style={styles.intro}>
        Some service categories require proof of professional certification before you can post gigs in them. Submit your documents below for admin review.
      </Text>

      {certifiedCategories.map((catData) => {
        const cat = catData.name;
        const cert = certMap[cat] as WorkerCertification | undefined;
        const status: Status = cert ? cert.status : "not_submitted";
        const canApply = status === "not_submitted" || status === "rejected";

        return (
          <View key={cat} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.catIcon}>{catData.icon}</Text>
              <View style={styles.cardTitleCol}>
                <Text style={styles.catName}>{cat}</Text>
                <Text style={styles.catDesc}>{catData.cert_description}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <StatusBadge status={status} />

              {status === "rejected" && cert?.admin_notes && (
                <Text style={styles.adminNotes}>Reason: {cert.admin_notes}</Text>
              )}

              {canApply && (
                <Pressable
                  style={styles.applyBtn}
                  onPress={() => navigation.navigate("RequestCertification", { category: cat })}
                >
                  <Text style={styles.applyBtnText}>
                    {status === "rejected" ? "Reapply" : "Apply"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: 12 },
  intro: { fontSize: 13, color: colors.subtext, lineHeight: 20, marginBottom: 4 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  catIcon: { fontSize: 30, marginTop: 2 },
  cardTitleCol: { flex: 1 },
  catName: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2 },
  catDesc: { fontSize: 12, color: colors.subtext, lineHeight: 18 },
  cardFooter: { gap: 8 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  adminNotes: { fontSize: 12, color: colors.danger, fontStyle: "italic" },

  applyBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandGreen,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
