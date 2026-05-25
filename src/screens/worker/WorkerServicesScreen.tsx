import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Image,
} from "react-native";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { getWorkerGigs, patchGigStatus, deleteGig } from "../../services/gigService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { Badge } from "../../components/common/Badge";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { Gig, ServiceCategory } from "../../types";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

export function WorkerServicesScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["worker-gigs", dbUserId],
    queryFn: ({ pageParam = 1 }) => getWorkerGigs(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
  });

  const gigs = data?.pages.flatMap((p) => p.data) ?? [];

  const toggleStatus = async (gig: Gig) => {
    const isActive = gig.status?.toLowerCase() === "active" || !gig.status;
    const next = isActive ? "paused" : "active";
    try {
      await patchGigStatus(gig.id, next);
      qc.invalidateQueries({ queryKey: ["worker-gigs"] });
    } catch {
      Alert.alert("Error", "Could not update status");
    }
  };

  const handleDelete = (gig: Gig) => {
    Alert.alert("Delete Service", `Delete "${gig.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGig(gig.id);
            qc.invalidateQueries({ queryKey: ["worker-gigs"] });
          } catch {
            Alert.alert("Error", "Could not delete service");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.topActionSection}>
        <Pressable
          style={styles.addServiceBtn}
          onPress={() => navigation.navigate("AddEditService", { gigId: undefined })}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addServiceBtnText}>Add Service</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={gigs}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brandGreen} style={{ margin: 16 }} /> : null}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => { qc.removeQueries({ queryKey: ["worker-gigs", dbUserId] }); refetch(); }}
              tintColor={colors.brandGreen}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🛠️"
              title="No services yet"
              message="Add your first service to start getting jobs."
              actionLabel="Add Service"
              onAction={() =>
                navigation.navigate("AddEditService", { gigId: undefined })
              }
            />
          }
          renderItem={({ item: gig }) => (
            <Pressable 
              style={styles.gigCard}
              onPress={() => navigation.navigate("AddEditService", { gigId: gig.id })}
            >
              <View style={styles.imageContainer}>
                {gig.attachments?.[0] ? (
                  <Image
                    source={{ uri: typeof gig.attachments[0] === "string" ? gig.attachments[0] : (gig.attachments[0] as { url?: string })?.url ?? "" }}
                    style={styles.gigImage}
                  />
                ) : (
                  <View style={styles.placeholderBox}>
                    <Text style={styles.placeholderEmoji}>🛠️</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.gigTitle} numberOfLines={1}>
                    {gig.title}
                  </Text>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.gigPrice}>from Rs. {gig.base_price}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.gigCategory}>{gig.category}</Text>
                  <View style={styles.dotSeparator} />
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: (gig.status?.toLowerCase() === "active" || !gig.status) ? colors.brandGreenLight : colors.borderLight }
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      { color: (gig.status?.toLowerCase() === "active" || !gig.status) ? colors.brandGreen : colors.subtext }
                    ]}>
                      {(gig.status?.toLowerCase() === "active" || !gig.status) ? "Active" : "Paused"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => toggleStatus(gig)}
                    style={styles.actionBtn}
                  >
                    <Ionicons
                      name={(gig.status?.toLowerCase() === "active" || !gig.status) ? "pause" : "play"}
                      size={18}
                      color={colors.text}
                    />
                    <Text style={styles.actionBtnText}>
                      {(gig.status?.toLowerCase() === "active" || !gig.status) ? "Pause" : "Activate"}
                    </Text>
                  </Pressable>
                  
                  <View style={styles.actionDivider} />
                  
                  <Pressable
                    onPress={() => navigation.navigate("AddEditService", { gigId: gig.id })}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.text} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={() => handleDelete(gig)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topActionSection: {
    padding: spacing.lg,
    backgroundColor: colors.card,
  },
  addServiceBtn: {
    backgroundColor: colors.brandGreen,
    flexDirection: "row",
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addServiceBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  gigCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 1,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.borderLight,
  },
  gigImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  gigTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  gigPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.brandGreen,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.brandGreen,
    marginLeft: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  gigCategory: {
    fontSize: 13,
    color: colors.subtext,
    fontWeight: "600",
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.subtext,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  actionDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.borderLight,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
});


