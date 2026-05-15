import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { getGigById } from "../../services/gigService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Input } from "../../components/common/Input";
import { BookingStepDots } from "../../components/booking/BookingStepDots";
import { StickyPriceCTA } from "../../components/booking/StickyPriceCTA";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import type { BookingFlowParamList } from "./BookingFlowNavigator";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

type RouteProps = RouteProp<BookingFlowParamList, "GigBooking">;
type Nav = NativeStackNavigationProp<BookingFlowParamList>;

const MAX_NOTES = 300;
const MAX_IMAGES = 4;

export function GigBookingScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { gigId } = route.params;
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [pickingImage, setPickingImage] = useState(false);

  const { data: gig, isLoading } = useQuery({
    queryKey: ["gig", gigId],
    queryFn: () => getGigById(gigId),
  });

  if (isLoading || !gig) return <LoadingSpinner />;

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

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <BookingStepDots currentStep={1} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={styles.pageTitle}>Additional details</Text>
          <Text style={styles.pageSubtitle}>Help the worker understand what you need</Text>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Notes</Text>
            <Input
              value={notes}
              onChangeText={(t) => setNotes(t.slice(0, MAX_NOTES))}
              placeholder="e.g. Use the back entrance, dog is friendly, specific instructions..."
              multiline
              numberOfLines={4}
              style={styles.notesInput}
            />
            <Text style={styles.charCount}>{notes.length}/{MAX_NOTES}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionHeading}>Photos</Text>
              <Text style={styles.sectionHint}>{images.length}/{MAX_IMAGES}</Text>
            </View>
            <Text style={styles.sectionSubtext}>Add photos to help describe the job (optional)</Text>

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
      </ScrollView>

      <StickyPriceCTA
        label="Continue"
        price={gig.base_price.toLocaleString()}
        onPress={() =>
          navigation.navigate("LocationSelection", { gigId, notes, imageUris: images })
        }
      />
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
  content: { paddingBottom: 120 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.subtext,
    marginBottom: spacing.xl,
  },
  section: { marginBottom: spacing.xl },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.subtext,
    fontWeight: "500",
  },
  sectionSubtext: {
    fontSize: 13,
    color: colors.subtext,
    marginBottom: spacing.md,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: colors.placeholder,
    textAlign: "right",
    marginTop: 4,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
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
  addImageText: {
    fontSize: 12,
    color: colors.brandGreen,
    fontWeight: "600",
  },
});
