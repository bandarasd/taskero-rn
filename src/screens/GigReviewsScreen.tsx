import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRoute, RouteProp } from "@react-navigation/native";
import { getGigReviews } from "../services/reviewService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { Avatar } from "../components/common/Avatar";
import { StarRating } from "../components/gigs/StarRating";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type RouteProps = RouteProp<CustomerStackParamList, "GigReviews">;

export function GigReviewsScreen() {
  const route = useRoute<RouteProps>();
  const { gigId } = route.params;

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", "gig", gigId],
    queryFn: () => getGigReviews(gigId),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="⭐" title="No reviews yet" />}
        renderItem={({ item: r }) => {
          const name = r.reviewer
            ? `${r.reviewer.first_name ?? ""} ${r.reviewer.last_name ?? ""}`.trim()
            : "Anonymous";
          return (
            <View style={styles.card}>
              <View style={styles.header}>
                <Avatar uri={r.reviewer?.avatar_url} name={name} size={36} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.name}>{name}</Text>
                  <StarRating value={r.rating} size={14} />
                </View>
                <Text style={styles.date}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                </Text>
              </View>
              {r.body ? <Text style={styles.body}>{r.body}</Text> : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 32 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: spacing.sm,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  date: { fontSize: 11, color: colors.subtext },
  body: { fontSize: 14, color: colors.text, lineHeight: 22 },
});
