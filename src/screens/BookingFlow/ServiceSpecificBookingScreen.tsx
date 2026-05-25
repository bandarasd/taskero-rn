import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getGigById } from "../../services/gigService";
import { Input } from "../../components/common/Input";
import { BookingStepDots } from "../../components/booking/BookingStepDots";
import { StickyPriceCTA } from "../../components/booking/StickyPriceCTA";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useCategoryByName } from "../../hooks/useCategories";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

type RouteProps = RouteProp<BookingFlowParamList, "ServiceSpecific">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

type Field = {
  key: string;
  label: string;
  placeholder: string;
  helper?: string;
  type: "text" | "number-chips" | "options-chips";
  options?: string[];
};


const MAX_NOTES = 300;
const MAX_IMAGES = 4;

export function ServiceSpecificBookingScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId, taskerId, address, latitude, longitude, scheduledAt, category } = route.params;
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [pickingImage, setPickingImage] = useState(false);

  const { data: gig } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  const { data: categoryData } = useCategoryByName(category);
  const fields: Field[] = (categoryData?.booking_fields as Field[]) ?? [];
  const icon = categoryData?.icon ?? "📋";

  const setValue = (key: string, val: string) => setValues((prev) => ({ ...prev, [key]: val }));

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit reached", `You can upload up to ${MAX_IMAGES} images.`);
      return;
    }
    setPickingImage(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 0.8,
      });
      if (!result.canceled) {
        const uris = result.assets.map((a) => a.uri);
        setImages((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
      }
    } finally {
      setPickingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const renderField = (field: Field) => {
    switch (field.type) {
      case "number-chips":
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.chipsRow}>
              {["1", "2", "3", "4", "5+"].map((num) => {
                const isSelected = values[field.key] === num;
                return (
                  <Pressable
                    key={num}
                    style={[styles.numberChip, isSelected && styles.selectedChip]}
                    onPress={() => setValue(field.key, num)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>{num}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      case "options-chips":
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.chipsRow}>
              {field.options?.map((opt) => {
                const isSelected = values[field.key] === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.optionChip, isSelected && styles.selectedChip]}
                    onPress={() => setValue(field.key, opt)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      default:
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Input
              label={field.label}
              placeholder={field.placeholder}
              value={values[field.key] ?? ""}
              onChangeText={(val) => setValue(field.key, val)}
            />
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <BookingStepDots currentStep={3} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>{icon}</Text>
          <Text style={styles.title}>{category} details</Text>
          <Text style={styles.subtitle}>Help us prepare the best quote for you</Text>
        </View>

        <View style={styles.form}>
          {fields.map(renderField)}
        </View>

        {/* Job description + photos */}
        <View style={styles.descSection}>
          <Text style={styles.sectionLabel}>Job description</Text>
          <Input
            placeholder="e.g. Use the back entrance, dog is friendly, specific instructions..."
            value={notes}
            onChangeText={(t) => setNotes(t.slice(0, MAX_NOTES))}
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
          <Text style={styles.charCount}>{notes.length}/{MAX_NOTES}</Text>

          <View style={styles.photosRow}>
            <View style={styles.photosLabelRow}>
              <Text style={styles.sectionLabel}>Photos</Text>
              <Text style={styles.photoCount}>{images.length}/{MAX_IMAGES}</Text>
            </View>
            <Text style={styles.photosHint}>Add photos to help describe the job (optional)</Text>
            <View style={styles.imagesGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageThumbWrap}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <Pressable style={styles.imageRemoveBtn} onPress={() => removeImage(index)}>
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <Pressable style={styles.addImageBtn} onPress={pickImage} disabled={pickingImage}>
                  {pickingImage ? (
                    <ActivityIndicator size="small" color={colors.brandGreen} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={28} color={colors.brandGreen} />
                      <Text style={styles.addImageText}>Add photo</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.subtext} />
          <Text style={styles.infoText}>All fields are optional but help your tasker prepare.</Text>
        </View>
      </ScrollView>

      <StickyPriceCTA
        label="Continue"
        onPress={() =>
          navigation.navigate("ReviewSummary", {
            gigId,
            taskerId,
            address,
            latitude,
            longitude,
            scheduledAt,
            category,
            details: values,
            basePrice: gig?.base_price ?? 0,
            notes: notes || undefined,
            imageUris: images.length > 0 ? images : undefined,
          })
        }
      />
    </KeyboardAvoidingView>
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
  content: { padding: spacing.lg, paddingBottom: 120 },
  titleSection: { marginBottom: spacing.xl },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.subtext, marginTop: 4 },
  form: { marginBottom: spacing.lg },
  fieldContainer: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  numberChip: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    margin: spacing.xs,
    backgroundColor: colors.card,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    margin: spacing.xs,
    backgroundColor: colors.card,
  },
  selectedChip: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  chipText: { fontSize: 15, fontWeight: "600", color: colors.text },
  selectedChipText: { color: "#FFFFFF" },

  descSection: { marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  notesInput: { minHeight: 100, textAlignVertical: "top" },
  charCount: {
    fontSize: 11,
    color: colors.placeholder,
    textAlign: "right",
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  photosRow: {},
  photosLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  photoCount: { fontSize: 13, color: colors.subtext, fontWeight: "500" },
  photosHint: { fontSize: 13, color: colors.subtext, marginBottom: spacing.md },
  imagesGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  imageThumbWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    overflow: "visible",
    position: "relative",
  },
  imageThumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
  },
  imageRemoveBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.card,
    borderRadius: 11,
  },
  addImageBtn: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.brandGreenLight,
  },
  addImageText: { fontSize: 12, color: colors.brandGreen, fontWeight: "600" },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  infoText: { fontSize: 13, color: colors.subtext, marginLeft: spacing.sm, flex: 1 },
});
