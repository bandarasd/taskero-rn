import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { createReview } from "../services/reviewService";
import { StarRating } from "../components/gigs/StarRating";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useAuth } from "../store/authStore";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type RouteProps = RouteProp<CustomerStackParamList, "AddReview">;

export function AddReviewScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { taskId, gigId, taskerId } = route.params;
  const { dbUserId } = useAuth();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createReview({ task_id: taskId, gig_id: gigId, tasker_id: taskerId, rating, body });
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Could not submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Leave a Review</Text>
        <View style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>Your Rating</Text>
          <StarRating value={rating} onChange={setRating} size={40} style={{ justifyContent: "center", marginTop: 12 }} />
        </View>
        <Input
          label="Comments (optional)"
          value={body}
          onChangeText={setBody}
          placeholder="Share your experience..."
          multiline
          numberOfLines={5}
          style={{ height: 120, textAlignVertical: "top", paddingTop: 12 }}
        />
        <Button label="Submit Review" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48 },
  heading: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 24 },
  ratingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  ratingLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
});
