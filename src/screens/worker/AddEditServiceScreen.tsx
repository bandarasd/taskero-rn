import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGigById, createGig, updateGig } from "../../services/gigService";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { SERVICE_CATEGORIES, ServiceCategory } from "../../types";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type RouteProps = RouteProp<WorkerStackParamList, "AddEditService">;

export function AddEditServiceScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const { gigId } = route.params;
  const isEdit = !!gigId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("General");
  const [loading, setLoading] = useState(false);

  const { data: existingGig, isLoading } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingGig) {
      setTitle(existingGig.title ?? "");
      setDescription(existingGig.description ?? "");
      setBasePrice(String(existingGig.base_price ?? ""));
      setCategory((existingGig.category as ServiceCategory) ?? "General");
    }
  }, [existingGig]);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Enter a service title"); return; }
    if (!basePrice || isNaN(parseFloat(basePrice))) { Alert.alert("Enter a valid price"); return; }
    if (!dbUserId) return;

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        base_price: parseFloat(basePrice),
        category,
        tasker_id: dbUserId,
      };
      if (isEdit && gigId) {
        await updateGig(gigId, payload);
      } else {
        await createGig(payload);
      }
      qc.invalidateQueries({ queryKey: ["worker-gigs"] });
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Could not save service.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{isEdit ? "Edit Service" : "Add Service"}</Text>

        <Input label="Service Title" value={title} onChangeText={setTitle} placeholder="e.g. Professional Deep Cleaning" />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what's included..."
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
        />
        <Input label="Starting Price (Rs.)" value={basePrice} onChangeText={setBasePrice} placeholder="e.g. 45" keyboardType="decimal-pad" />

        <Text style={styles.categoryLabel}>Category</Text>
        <View style={styles.categoryGrid}>
          {SERVICE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipSelected]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catChipText, category === cat && styles.catChipTextSelected]}>{cat}</Text>
            </Pressable>
          ))}
        </View>

        <Button label={isEdit ? "Save Changes" : "Create Service"} onPress={handleSave} loading={loading} style={{ marginTop: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48 },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 24 },
  categoryLabel: { fontSize: 13, fontWeight: "600", color: colors.subtext, marginBottom: 10 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipSelected: { backgroundColor: colors.brandGreen, borderColor: colors.brandGreen },
  catChipText: { fontSize: 13, fontWeight: "500", color: colors.text },
  catChipTextSelected: { color: "#fff" },
});
