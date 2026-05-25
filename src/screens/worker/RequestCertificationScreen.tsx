import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { submitCertification } from "../../services/certificationService";
import { Button } from "../../components/common/Button";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { useCategoryByName } from "../../hooks/useCategories";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type RouteProps = RouteProp<WorkerStackParamList, "RequestCertification">;


export function RequestCertificationScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const { category } = route.params;

  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: categoryData } = useCategoryByName(category);
  const requirements: string[] = categoryData?.cert_requirements ?? [];
  const icon = categoryData?.icon ?? "📄";

  const handlePickDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setDocumentUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!documentUri) {
      Alert.alert("Document required", "Please upload your certification document.");
      return;
    }
    if (!dbUserId) return;

    setLoading(true);
    try {
      await submitCertification(dbUserId, category as ServiceCategory, documentUri);
      qc.invalidateQueries({ queryKey: ["worker-certs", dbUserId] });
      Alert.alert(
        "Submitted",
        "Your certification request has been submitted for review. We'll notify you once approved.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not submit certification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Category header */}
        <View style={styles.categoryHeader}>
          <Text style={styles.catIcon}>{icon}</Text>
          <Text style={styles.catName}>{category}</Text>
          <Text style={styles.catSub}>Certification Application</Text>
        </View>

        {/* Requirements */}
        {requirements.length > 0 && (
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Accepted Documents</Text>
            {requirements.map((req, i) => (
              <View key={i} style={styles.reqRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.brandGreen} />
                <Text style={styles.reqText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Document picker */}
        <Text style={styles.sectionLabel}>Upload Document</Text>
        <Pressable style={styles.uploadArea} onPress={handlePickDocument}>
          {documentUri ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: documentUri }} style={styles.preview} />
              <View style={styles.changeOverlay}>
                <Text style={styles.changeText}>Tap to change</Text>
              </View>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={36} color={colors.brandGreen} />
              <Text style={styles.uploadTitle}>Tap to upload</Text>
              <Text style={styles.uploadSub}>JPG, PNG, or PDF — max 10MB</Text>
            </>
          )}
        </Pressable>

        <Button
          label="Submit for Review"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 24 }}
        />

        <Text style={styles.disclaimer}>
          Your document will be reviewed by our team. This may take 1–3 business days.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48, gap: 16 },

  categoryHeader: { alignItems: "center", paddingVertical: 16, gap: 6 },
  catIcon: { fontSize: 48 },
  catName: { fontSize: 22, fontWeight: "700", color: colors.text },
  catSub: { fontSize: 14, color: colors.subtext },

  requirementsCard: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  requirementsTitle: { fontSize: 14, fontWeight: "700", color: colors.brandGreenDark },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  reqText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  uploadArea: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderStyle: "dashed",
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 8,
  },
  uploadTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  uploadSub: { fontSize: 12, color: colors.subtext },
  previewWrapper: { width: "100%", position: "relative" },
  preview: { width: "100%", height: 220, resizeMode: "cover" },
  changeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 8,
    alignItems: "center",
  },
  changeText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  disclaimer: { fontSize: 12, color: colors.subtext, textAlign: "center", lineHeight: 18 },
});
