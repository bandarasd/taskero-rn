import React from "react";
import { FlatList, StyleSheet, View, ActivityIndicator } from "react-native";
import { Gig } from "../../types";
import { GigCard } from "../gigs/GigCard";
import { SectionHeader } from "./SectionHeader";
import { spacing } from "../../theme/spacing";
import { EmptyState } from "../common/EmptyState";

interface ServiceSectionProps {
  title: string;
  gigs: Gig[];
  onSeeAll?: () => void;
  loading?: boolean;
  onGigPress: (gig: Gig) => void;
  emptyIcon?: string;
}

export function ServiceSection({
  title,
  gigs,
  onSeeAll,
  loading,
  onGigPress,
  emptyIcon = "🛠️",
}: ServiceSectionProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <SectionHeader title={title} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#16A34A" />
        </View>
      </View>
    );
  }

  if (gigs.length === 0) {
    return (
      <View style={styles.container}>
        <SectionHeader title={title} />
        <View style={styles.emptyContainer}>
          <EmptyState icon={emptyIcon} title="No services found" style={{ height: 120 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader title={title} onSeeAll={onSeeAll} />
      <FlatList
        data={gigs}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <GigCard gig={item} onPress={() => onGigPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  loaderContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingBottom: 8,
  },
});
