import { apiRequest } from "./apiClient";
import { ChatThread, APIChatMessage } from "../types";

function mapMessage(m: any): APIChatMessage {
  return {
    ...m,
    body: m.message_text ?? m.body ?? "",
    message_type: m.message_type ?? 'text',
  };
}

export async function getChatThreads(userId: string) {
  return apiRequest<ChatThread[]>(`/chat/threads/${encodeURIComponent(userId)}`);
}

export async function getChatMessages(threadId: string) {
  const messages = await apiRequest<any[]>(`/chat/messages/${encodeURIComponent(threadId)}`);
  return messages.map(mapMessage);
}

export async function sendMessage(
  threadId: string,
  messageText: string,
  senderId: string,
  opts?: { messageType?: string; refTaskId?: string }
) {
  const msg = await apiRequest<any>("/chat/messages", {
    method: "POST",
    body: {
      thread_id: threadId,
      sender_id: senderId,
      message_text: messageText,
      message_type: opts?.messageType ?? 'text',
      ref_task_id: opts?.refTaskId ?? null,
    },
  });
  return mapMessage(msg);
}

export async function createThread(customerId: string, taskerId: string, taskId?: string) {
  return apiRequest<ChatThread>("/chat/thread", {
    method: "POST",
    body: { customer_id: customerId, tasker_id: taskerId, task_id: taskId },
  });
}

export async function markMessagesRead(threadId: string, readerId: string) {
  return apiRequest<{ success: boolean }>(`/chat/messages/${encodeURIComponent(threadId)}/read`, {
    method: "PUT",
    body: { reader_id: readerId },
  });
}
