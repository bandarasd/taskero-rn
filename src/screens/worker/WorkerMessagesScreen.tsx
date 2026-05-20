import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getChatThreads } from "../../services/chatService";
import { ThreadListItem } from "../../components/chat/ThreadListItem";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

export function WorkerMessagesScreen() {
  const { dbUserId } = useAuth();
  const navigation = useNavigation<Nav>();

  const { data: threads, isLoading, refetch } = useQuery({
    queryKey: ["threads", dbUserId],
    queryFn: () => getChatThreads(dbUserId!),
    enabled: !!dbUserId,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Messages</Text>
      </View>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon="💬" title="No messages yet" message="Your customer conversations will appear here." />}
          renderItem={({ item }) => (
            <ThreadListItem
              thread={item}
              myId={dbUserId!}
              onPress={() => {
                const other = item.tasker_id === dbUserId ? item.customer : item.tasker;
                const otherName = other
                  ? `${other.first_name ?? ""} ${other.last_name ?? ""}`.trim()
                  : "Customer";
                navigation.navigate("WorkerChat", { threadId: item.id, otherUserName: otherName, taskId: item.task_id ?? undefined });
              }}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heading: { fontSize: 26, fontWeight: "700", color: colors.text },
});
