import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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
  const qc = useQueryClient();
  const { category } = route.params;

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["gigs", "category", category],
    queryFn: ({ pageParam = 1 }) => getGigsByCategory(category as ServiceCategory, pageParam, 15),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const gigs = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{CATEGORY_ICONS[category as ServiceCategory] ?? "🛠️"}</Text>
        <Text style={styles.title}>{category}</Text>
        <Text style={styles.count}>{gigs.length} services</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={gigs}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => { qc.removeQueries({ queryKey: ["gigs", "category", category] }); refetch(); }}
            />
          }
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brandGreen} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="No services yet"
              message={`No ${category} services available in your area yet.`}
            />
          }
          renderItem={({ item: g }) => (
            <GigListItem
              gig={g}
              onPress={() => navigation.navigate("ServiceDetail", { gigId: g.id })}
            />
          )}
        />
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
