import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getChatMessages, sendMessage, markMessagesRead } from "../../services/chatService";
import { getTaskById } from "../../services/taskService";
import { MessageBubble } from "../../components/chat/MessageBubble";
import { BookingCard } from "../../components/chat/BookingCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { useAuth } from "../../store/authStore";
import { env } from "../../services/env";
import { APIChatMessage, APITask } from "../../types";
import type { WorkerStackParamList } from "../../navigation/stacks/WorkerStack";

type RouteProps = RouteProp<WorkerStackParamList, "WorkerChat">;
type Nav = NativeStackNavigationProp<WorkerStackParamList>;

function mapMessage(m: any): APIChatMessage {
  return { ...m, body: m.message_text ?? m.body ?? "", message_type: m.message_type ?? 'text' };
}

export function WorkerChatScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { threadId, taskId } = route.params;
  const { dbUserId } = useAuth();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<APIChatMessage[]>([]);
  const [taskCache, setTaskCache] = useState<Record<string, APITask>>({});
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchTask = (id: string) => {
    if (taskCache[id]) return;
    getTaskById(id).then((t) => setTaskCache((prev) => ({ ...prev, [id]: t }))).catch(() => {});
  };

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasOlderMessages || messages.length === 0) return;
    const oldestId = messages[0].id;
    setLoadingOlder(true);
    try {
      const res = await getChatMessages(threadId, oldestId, 30);
      if (res.data.length > 0) {
        setMessages((prev) => [...res.data, ...prev]);
        res.data.forEach((m) => { if (m.message_type === 'booking_ref' && m.ref_task_id) fetchTask(m.ref_task_id); });
      }
      setHasOlderMessages(res.pagination.hasMore);
    } catch {} finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasOlderMessages, messages, threadId]);

  useEffect(() => {
    let mounted = true;

    getChatMessages(threadId)
      .then((res) => {
        if (!mounted) return;
        setMessages(res.data);
        setHasOlderMessages(res.pagination.hasMore);
        setLoading(false);
        res.data.forEach((m) => { if (m.message_type === 'booking_ref' && m.ref_task_id) fetchTask(m.ref_task_id); });
      })
      .catch(() => { if (mounted) setLoading(false); });

    if (dbUserId) {
      markMessagesRead(threadId, dbUserId)
        .then(() => qc.invalidateQueries({ queryKey: ["threads", dbUserId] }))
        .catch(() => {});
    }

    const ws = new WebSocket(`${env.wsBaseUrl}/ws`);

    ws.onopen = () => { ws.send(JSON.stringify({ action: "subscribe", thread_id: threadId })); };

    ws.onmessage = (event) => {
      if (!mounted) return;
      try {
        const msg = mapMessage(JSON.parse(event.data));
        if (msg.message_type === 'booking_ref' && msg.ref_task_id) fetchTask(msg.ref_task_id);
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        flatListRef.current?.scrollToEnd({ animated: true });
      } catch {}
    };

    return () => {
      mounted = false;
      ws.close();
    };
  }, [threadId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !dbUserId) return;
    setText("");
    setSending(true);
    try {
      // Send booking card first if this task hasn't been referenced yet in this thread
      if (taskId && !messages.some((m) => m.message_type === 'booking_ref' && m.ref_task_id === taskId)) {
        const cardMsg = await sendMessage(threadId, '', dbUserId, {
          messageType: 'booking_ref',
          refTaskId: taskId,
        });
        if (taskId && !taskCache[taskId]) fetchTask(taskId);
        setMessages((prev) => prev.some((m) => m.id === cardMsg.id) ? prev : [...prev, cardMsg]);
      }

      const msg = await sendMessage(threadId, trimmed, dbUserId);
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onScrollBeginDrag={() => { if (hasOlderMessages) loadOlderMessages(); }}
        ListHeaderComponent={loadingOlder ? <ActivityIndicator color={colors.brandGreen} style={{ margin: 12 }} /> : null}
        renderItem={({ item }) => {
          if (item.message_type === 'booking_ref' && item.ref_task_id) {
            const taskData = taskCache[item.ref_task_id];
            if (!taskData) return <View style={styles.cardPlaceholder} />;
            return (
              <BookingCard
                task={taskData}
                onPress={() => navigation.navigate("WorkerJobDetail", { taskId: taskData.id })}
              />
            );
          }
          return <MessageBubble message={item} isMine={item.sender_id === dbUserId} />;
        }}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingVertical: 12 },
  cardPlaceholder: { height: 80, marginHorizontal: spacing.md, marginVertical: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.brandGreen,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: -2 },
});
