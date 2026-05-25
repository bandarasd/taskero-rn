import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../common/Avatar";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";

const QUICK_TAGS = [
  "Punctual",
  "Clean work",
  "Friendly",
  "Professional",
  "Good value",
  "Communicated well",
];

const RATING_LABELS: Record<number, string> = {
  1: "😞  Terrible",
  2: "😐  Not great",
  3: "🙂  OK",
  4: "😊  Good",
  5: "🤩  Amazing!",
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, tags: string[], body: string) => Promise<void>;
  taskerName: string;
  taskerAvatar?: string | null;
}

export function RateTaskerModal({ visible, onClose, onSubmit, taskerName, taskerAvatar }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"stars" | "details">("stars");
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const starScales = useRef(Array.from({ length: 5 }, () => new Animated.Value(1))).current;

  // Reset when modal reopens
  useEffect(() => {
    if (visible) {
      setStep("stars");
      setRating(0);
      setSelectedTags([]);
      setBody("");
      setSubmitting(false);
    }
  }, [visible]);

  const animateStar = (index: number) => {
    const anim = starScales[index];
    Animated.sequence([
      Animated.spring(anim, { toValue: 1.4, useNativeDriver: true, speed: 40 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const handleStarPress = (star: number) => {
    setRating(star);
    animateStar(star - 1);
    // Short delay before advancing to details step
    setTimeout(() => setStep("details"), 350);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(rating, selectedTags, body);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleSkip}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Tasker info */}
          <View style={styles.taskerRow}>
            <Avatar uri={taskerAvatar} name={taskerName} size={56} />
            <View style={styles.taskerTextCol}>
              <Text style={styles.howWasLabel}>How was your experience?</Text>
              <Text style={styles.taskerName}>{taskerName}</Text>
            </View>
          </View>

          {step === "stars" ? (
            <>
              {/* Stars */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => handleStarPress(star)} activeOpacity={0.7}>
                    <Animated.View style={{ transform: [{ scale: starScales[star - 1] }] }}>
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={48}
                        color={star <= rating ? colors.brandGreen : "#D1D5DB"}
                        style={styles.starIcon}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
              )}
              {rating === 0 && (
                <Text style={styles.ratingPlaceholder}>Tap a star to rate</Text>
              )}

              {/* Skip */}
              <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Re-show stars (smaller, read-only) */}
              <View style={styles.starsRowSmall}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={28}
                      color={star <= rating ? colors.brandGreen : "#D1D5DB"}
                      style={{ marginHorizontal: 3 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick tags */}
              <Text style={styles.sectionLabel}>What went well?</Text>
              <View style={styles.tagsWrap}>
                {QUICK_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[styles.tagChip, selected && styles.tagChipSelected]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comment */}
              <Text style={styles.sectionLabel}>Add a comment (optional)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience..."
                placeholderTextColor={colors.placeholder}
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitText}>{submitting ? "Submitting…" : "Submit Review"}</Text>
              </TouchableOpacity>

              {/* Skip */}
              <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 20,
  },
  taskerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    gap: 14,
  },
  taskerTextCol: {
    flex: 1,
  },
  howWasLabel: {
    fontSize: 13,
    color: colors.subtext,
    fontWeight: "500",
    marginBottom: 2,
  },
  taskerName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  starIcon: {
    marginHorizontal: 6,
  },
  ratingLabel: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  ratingPlaceholder: {
    textAlign: "center",
    fontSize: 15,
    color: colors.placeholder,
    marginBottom: 8,
  },
  starsRowSmall: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tagChipSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreenLight,
  },
  tagText: {
    fontSize: 13,
    color: colors.subtext,
    fontWeight: "500",
  },
  tagTextSelected: {
    color: colors.brandGreen,
    fontWeight: "600",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: colors.brandGreen,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 8,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  skipText: {
    fontSize: 14,
    color: colors.subtext,
    fontWeight: "500",
  },
});
