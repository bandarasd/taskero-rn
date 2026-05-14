import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getGigsByCategory } from "../services/gigService";
import { GigListItem } from "../components/gigs/GigListItem";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { CATEGORY_ICONS, ServiceCategory } from "../types";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type RouteProps = RouteProp<CustomerStackParamList, "CategoryServices">;
type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function CategoryServicesScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { category } = route.params;

  const { data: gigs, isLoading, refetch } = useQuery({
    queryKey: ["gigs", "category", category],
    queryFn: () => getGigsByCategory(category as ServiceCategory),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{CATEGORY_ICONS[category as ServiceCategory] ?? "🛠️"}</Text>
        <Text style={styles.title}>{category}</Text>
        <Text style={styles.count}>{gigs?.length ?? 0} services</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
          {!gigs || gigs.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No services yet"
              message={`No ${category} services available in your area yet.`}
            />
          ) : (
            gigs.map((g) => (
              <GigListItem
                key={g.id}
                gig={g}
                onPress={() => navigation.navigate("ServiceDetail", { gigId: g.id })}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
  count: { fontSize: 13, color: colors.subtext },
  list: { padding: spacing.lg, paddingBottom: 32 },
});
