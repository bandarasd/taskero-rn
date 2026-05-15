import React from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, StatusBar, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getNotifications, markNotificationRead } from "../services/notificationService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useAuth } from "../store/authStore";
import { APINotification } from "../types";

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { dbUserId } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", dbUserId],
    queryFn: () => getNotifications(dbUserId!),
    enabled: !!dbUserId,
  });

  const handleRead = async (n: APINotification) => {
    if (n.is_read) return;
    try {
      await markNotificationRead(n.id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch {}
  };

  const renderItem = ({ item: n }: { item: APINotification }) => (
    <Pressable
      onPress={() => handleRead(n)}
      style={[styles.card, !n.is_read && styles.cardUnread]}
    >
      <View style={[styles.iconContainer, n.is_read ? styles.iconRead : styles.iconUnread]}>
        <Ionicons
          name={n.is_read ? "notifications-outline" : "notifications"}
          size={22}
          color={n.is_read ? colors.placeholder : colors.brandGreen}
        />
        {!n.is_read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !n.is_read && styles.titleUnread]}>{n.title}</Text>
          <Text style={styles.time}>
            {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
          </Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {n.body}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ backgroundColor: "#fff" }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111111" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(n) => n.id}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.brandGreen}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState icon="🔔" title="No notifications yet" />
            </View>
          }
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
    gap: 16,
  },
  cardUnread: {
    backgroundColor: "#fff", // Keep it white but maybe a subtle tint if needed
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconRead: {
    backgroundColor: colors.borderLight,
  },
  iconUnread: {
    backgroundColor: colors.brandGreen + "15",
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandGreen,
    borderWidth: 2,
    borderColor: "#fff",
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: "800",
  },
  body: {
    fontSize: 13,
    color: colors.subtext,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: colors.placeholder,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
  },
  emptyContainer: {
    marginTop: 100,
    paddingHorizontal: 40,
  },
});

