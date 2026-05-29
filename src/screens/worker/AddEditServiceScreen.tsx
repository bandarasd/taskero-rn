import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { getGigById, createGig, updateGig, GigServiceArea } from "../../services/gigService";
import { getWorkerCertifications } from "../../services/certificationService";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { ServiceCategory, VisitTier } from "../../types";
import { useCategories } from "../../hooks/useCategories";
import { serviceAreaResult } from "../../utils/serviceAreaResult";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RouteProps = RouteProp<WorkerStackParamList, "AddEditService">;
type NavProp = NativeStackNavigationProp<WorkerStackParamList, "AddEditService">;

const MAX_IMAGES = 5;

type FieldErrors = {
  title?: string;
  description?: string;
  price?: string;
  serviceArea?: string;
  visitTiers?: string;
};

// Required label with red asterisk
function RequiredLabel({ text }: { text: string }) {
  return (
    <Text style={styles.sectionLabel}>
      {text}
      <Text style={styles.requiredStar}> *</Text>
    </Text>
  );
}

export function AddEditServiceScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const { gigId } = route.params;
  const isEdit = !!gigId;
  const scrollRef = useRef<ScrollView>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("General");
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [certBanner, setCertBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Image state: existing URLs from server + new local URIs
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]);

  // Service area
  const [serviceArea, setServiceArea] = useState<GigServiceArea | null>(null);

  // Visit tiers
  const DEFAULT_TIER: VisitTier = { label: "Standard", days: 7, surcharge_type: "percent", surcharge_value: 0 };
  const [visitTiers, setVisitTiers] = useState<VisitTier[]>([DEFAULT_TIER]);

  // Pick up service area result when returning from ServiceAreaPickerScreen
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      const result = serviceAreaResult.consume();
      if (result) {
        setServiceArea(result);
        setFieldErrors((prev) => ({ ...prev, serviceArea: undefined }));
      }
    });
    return unsub;
  }, [navigation]);

  // Fetch existing gig in edit mode
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
      const attachments = existingGig.attachments;
      if (Array.isArray(attachments)) setExistingAttachments(attachments);
      if (existingGig.visit_tiers && existingGig.visit_tiers.length > 0) {
        setVisitTiers(existingGig.visit_tiers);
      }
      if (existingGig.service_area) {
        setServiceArea({
          latitude: existingGig.service_area.latitude,
          longitude: existingGig.service_area.longitude,
          radius_km: existingGig.service_area.radius_km,
        });
      }
    }
  }, [existingGig]);

  const { data: allCategories = [] } = useCategories();

  // Certification gate
  const { data: certifications = [] } = useQuery({
    queryKey: ["worker-certs", dbUserId],
    queryFn: () => getWorkerCertifications(dbUserId!),
    enabled: !!dbUserId,
  });
  const approvedCategories = certifications
    .filter((c) => c.status === "approved")
    .map((c) => c.category);

  const isCategoryLocked = (cat: ServiceCategory) => {
    const catData = allCategories.find((c) => c.name === cat);
    return (catData?.requires_certification ?? false) && !approvedCategories.includes(cat);
  };

  const handleCategorySelect = (cat: ServiceCategory) => {
    if (isCategoryLocked(cat)) {
      setCertBanner(
        `"${cat}" requires a certification. Go to Profile → Certifications to apply.`
      );
      return;
    }
    setCertBanner(null);
    setCategory(cat);
    setCategoryModalVisible(false);
  };

  // Image picker
  const handleAddImage = async () => {
    const totalImages = existingAttachments.length + newImageUris.length;
    if (totalImages >= MAX_IMAGES) {
      Alert.alert("Limit reached", `You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      setNewImageUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeExistingImage = (url: string) =>
    setExistingAttachments((prev) => prev.filter((u) => u !== url));

  const removeNewImage = (uri: string) =>
    setNewImageUris((prev) => prev.filter((u) => u !== uri));

  const handleOpenMapPicker = () => {
    navigation.navigate("ServiceAreaPicker", {
      gigId,
      initialLat: serviceArea?.latitude,
      initialLng: serviceArea?.longitude,
      initialRadius: serviceArea?.radius_km,
    });
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!title.trim()) errors.title = "Service title is required";
    if (!description.trim()) errors.description = "Description is required";
    if (!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0)
      errors.price = "A valid starting price is required";
    if (!serviceArea) errors.serviceArea = "Please set a service area on the map";
    const hasBaseline = visitTiers.some((t) => t.surcharge_value === 0 && t.label.trim());
    if (!hasBaseline) errors.visitTiers = "At least one tier with no surcharge is required";
    const invalidTier = visitTiers.some((t) => !t.label.trim());
    if (invalidTier) errors.visitTiers = "All tiers must have a name";
    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (isCategoryLocked(category)) {
      Alert.alert(
        "Certification Required",
        `You need an approved certification to offer "${category}" services. Apply in Profile → Certifications.`
      );
      return;
    }
    if (!dbUserId) return;

    setLoading(true);
    try {
      if (isEdit && gigId) {
        await updateGig(gigId, {
          title: title.trim(),
          description: description.trim(),
          base_price: parseFloat(basePrice),
          category,
          visit_tiers: visitTiers,
          imageUris: newImageUris,
          existingAttachments,
          serviceArea,
        });
      } else {
        await createGig({
          tasker_id: dbUserId,
          title: title.trim(),
          description: description.trim(),
          base_price: parseFloat(basePrice),
          category,
          visit_tiers: visitTiers,
          imageUris: newImageUris,
          serviceArea,
        });
      }
      qc.invalidateQueries({ queryKey: ["worker-gigs"] });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not save service.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const totalImages = existingAttachments.length + newImageUris.length;
  const serviceAreaError = fieldErrors.serviceArea;
  const mapBtnStyle = serviceAreaError
    ? [styles.mapPickerBtn, styles.mapPickerBtnError]
    : styles.mapPickerBtn;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Images */}
        <RequiredLabel text="Photos" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {existingAttachments.map((url) => (
            <View key={url} style={styles.imageThumb}>
              <Image source={{ uri: url }} style={styles.thumbImg} />
              <Pressable style={styles.removeBtn} onPress={() => removeExistingImage(url)}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          {newImageUris.map((uri) => (
            <View key={uri} style={styles.imageThumb}>
              <Image source={{ uri }} style={styles.thumbImg} />
              <Pressable style={styles.removeBtn} onPress={() => removeNewImage(uri)}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          {totalImages < MAX_IMAGES && (
            <Pressable style={styles.addImageBtn} onPress={handleAddImage}>
              <Ionicons name="add" size={28} color={colors.brandGreen} />
              <Text style={styles.addImageText}>{totalImages}/{MAX_IMAGES}</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Title */}
        <Input
          label="Service Title *"
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined }));
          }}
          placeholder="e.g. Professional Deep Cleaning"
          error={fieldErrors.title}
        />

        {/* Description */}
        <Input
          label="Description *"
          value={description}
          onChangeText={(v) => {
            setDescription(v);
            if (fieldErrors.description) setFieldErrors((p) => ({ ...p, description: undefined }));
          }}
          placeholder="Describe what's included..."
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
          error={fieldErrors.description}
        />

        {/* Price */}
        <Input
          label="Starting Price (Rs.) *"
          value={basePrice}
          onChangeText={(v) => {
            setBasePrice(v);
            if (fieldErrors.price) setFieldErrors((p) => ({ ...p, price: undefined }));
          }}
          placeholder="e.g. 2500"
          keyboardType="decimal-pad"
          error={fieldErrors.price}
        />

        {/* Category */}
        <RequiredLabel text="Category" />
        <Pressable style={styles.dropdownBtn} onPress={() => setCategoryModalVisible(true)}>
          <Text style={styles.dropdownValue}>
            {allCategories.find((c) => c.name === category)?.icon ?? "✨"} {category}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.subtext} />
        </Pressable>

        {certBanner && (
          <View style={styles.certBanner}>
            <Ionicons name="lock-closed" size={14} color={colors.warning} />
            <Text style={styles.certBannerText}>{certBanner}</Text>
          </View>
        )}

        {/* Service area */}
        <RequiredLabel text="Service Area" />
        <Pressable style={mapBtnStyle} onPress={handleOpenMapPicker}>
          <Ionicons
            name="map-outline"
            size={20}
            color={serviceAreaError ? colors.danger : colors.brandGreen}
          />
          <Text style={[styles.mapPickerText, serviceAreaError && styles.mapPickerTextError]}>
            {serviceArea
              ? `Within ${serviceArea.radius_km} km of selected location`
              : "Set service area on map"}
          </Text>
          {serviceArea && (
            <Pressable
              onPress={() => {
                setServiceArea(null);
                setFieldErrors((p) => ({ ...p, serviceArea: "Please set a service area on the map" }));
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.subtext} />
            </Pressable>
          )}
        </Pressable>
        {serviceAreaError && (
          <Text style={styles.fieldError}>{serviceAreaError}</Text>
        )}

        {/* Visit Tiers */}
        <RequiredLabel text="Visit Speed Tiers" />
        <Text style={styles.tierHint}>
          Define how quickly you can visit. At least one tier must have no surcharge (your standard rate).
        </Text>
        {visitTiers.map((tier, idx) => {
          const isBaseline = tier.surcharge_value === 0;
          return (
            <View key={idx} style={styles.tierRow}>
              <View style={styles.tierRowTop}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Tier name"
                    value={tier.label}
                    onChangeText={(v) => {
                      const updated = [...visitTiers];
                      updated[idx] = { ...updated[idx], label: v };
                      setVisitTiers(updated);
                    }}
                    placeholder="e.g. Standard"
                    style={styles.tierInput}
                  />
                </View>
                <View style={{ width: 80, marginLeft: spacing.sm }}>
                  <Input
                    label="Days"
                    value={String(tier.days)}
                    onChangeText={(v) => {
                      const d = parseInt(v) || 1;
                      const updated = [...visitTiers];
                      updated[idx] = { ...updated[idx], days: d };
                      setVisitTiers(updated);
                    }}
                    keyboardType="number-pad"
                    style={styles.tierInput}
                  />
                </View>
                {visitTiers.length > 1 && !isBaseline && (
                  <Pressable
                    style={styles.tierDeleteBtn}
                    onPress={() => setVisitTiers(visitTiers.filter((_, i) => i !== idx))}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                )}
              </View>
              {!isBaseline && (
                <View style={styles.tierSurchargeRow}>
                  <View style={styles.surchargeTypeToggle}>
                    <Pressable
                      style={[styles.toggleBtn, tier.surcharge_type === "percent" && styles.toggleBtnActive]}
                      onPress={() => {
                        const updated = [...visitTiers];
                        updated[idx] = { ...updated[idx], surcharge_type: "percent" };
                        setVisitTiers(updated);
                      }}
                    >
                      <Text style={[styles.toggleBtnText, tier.surcharge_type === "percent" && styles.toggleBtnTextActive]}>%</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleBtn, tier.surcharge_type === "flat" && styles.toggleBtnActive]}
                      onPress={() => {
                        const updated = [...visitTiers];
                        updated[idx] = { ...updated[idx], surcharge_type: "flat" };
                        setVisitTiers(updated);
                      }}
                    >
                      <Text style={[styles.toggleBtnText, tier.surcharge_type === "flat" && styles.toggleBtnTextActive]}>Rs.</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    style={[styles.surchargeInput]}
                    value={tier.surcharge_value === 0 ? "" : String(tier.surcharge_value)}
                    onChangeText={(v) => {
                      const val = parseFloat(v) || 0;
                      const updated = [...visitTiers];
                      updated[idx] = { ...updated[idx], surcharge_value: val };
                      setVisitTiers(updated);
                    }}
                    keyboardType="decimal-pad"
                    placeholder={tier.surcharge_type === "percent" ? "e.g. 20" : "e.g. 1000"}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              )}
            </View>
          );
        })}
        {fieldErrors.visitTiers && (
          <Text style={styles.fieldError}>{fieldErrors.visitTiers}</Text>
        )}
        {visitTiers.length < 4 && (
          <Pressable
            style={styles.addTierBtn}
            onPress={() =>
              setVisitTiers([
                ...visitTiers,
                { label: "", days: 3, surcharge_type: "percent", surcharge_value: 20 },
              ])
            }
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.brandGreen} />
            <Text style={styles.addTierText}>Add faster tier</Text>
          </Pressable>
        )}

        <Button
          label={isEdit ? "Save Changes" : "Create Service"}
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: 28 }}
        />
      </ScrollView>

      {/* Category picker modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {allCategories.map((catData) => {
                const cat = catData.name;
                const locked = isCategoryLocked(cat);
                const selected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catRow,
                      selected && styles.catRowSelected,
                      locked && styles.catRowLocked,
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                    activeOpacity={locked ? 0.5 : 0.7}
                  >
                    <Text style={styles.catRowIcon}>{catData.icon}</Text>
                    <Text
                      style={[
                        styles.catRowLabel,
                        selected && styles.catRowLabelSelected,
                        locked && styles.catRowLabelLocked,
                      ]}
                    >
                      {cat}
                    </Text>
                    {locked && (
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={12} color={colors.warning} />
                        <Text style={styles.lockText}>Cert. required</Text>
                      </View>
                    )}
                    {selected && !locked && (
                      <Ionicons name="checkmark" size={20} color={colors.brandGreen} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.subtext,
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  requiredStar: { color: colors.danger },
  fieldError: { fontSize: 12, color: colors.danger, marginTop: 4 },

  // Images
  imageRow: { marginBottom: 4 },
  imageThumb: { width: 84, height: 84, marginRight: 10, position: "relative" },
  thumbImg: { width: 84, height: 84, borderRadius: 10, backgroundColor: colors.border },
  removeBtn: { position: "absolute", top: -6, right: -6 },
  addImageBtn: {
    width: 84,
    height: 84,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandGreenLight,
  },
  addImageText: { fontSize: 11, color: colors.brandGreen, fontWeight: "600", marginTop: 2 },

  // Category dropdown
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownValue: { fontSize: 15, fontWeight: "500", color: colors.text },

  // Cert banner
  certBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.warningLight,
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 8,
  },
  certBannerText: { flex: 1, fontSize: 12, color: colors.warning, fontWeight: "500" },

  // Map picker
  mapPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  mapPickerBtnError: { borderColor: colors.danger },
  mapPickerText: { flex: 1, fontSize: 14, color: colors.text },
  mapPickerTextError: { color: colors.danger },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    maxHeight: "75%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginVertical: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  catRowSelected: { backgroundColor: colors.brandGreenLight },
  catRowLocked: { opacity: 0.65 },
  catRowIcon: { fontSize: 22, width: 32, textAlign: "center" },
  catRowLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: colors.text },
  catRowLabelSelected: { color: colors.brandGreen, fontWeight: "700" },
  catRowLabelLocked: { color: colors.subtext },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  lockText: { fontSize: 11, color: colors.warning, fontWeight: "600" },

  // Visit tiers
  tierHint: { fontSize: 12, color: colors.subtext, marginBottom: spacing.sm, lineHeight: 17 },
  tierRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  tierRowTop: { flexDirection: "row", alignItems: "flex-start" },
  tierSurchargeRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: spacing.sm },
  surchargeInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  tierInput: { height: 40, fontSize: 14 },
  tierDeleteBtn: {
    marginLeft: spacing.sm,
    marginTop: 24,
    padding: spacing.xs,
  },
  surchargeTypeToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  toggleBtnActive: { backgroundColor: colors.brandGreen },
  toggleBtnText: { fontSize: 13, fontWeight: "600", color: colors.subtext },
  toggleBtnTextActive: { color: "#fff" },
  addTierBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  addTierText: { fontSize: 14, color: colors.brandGreen, fontWeight: "600" },
});
