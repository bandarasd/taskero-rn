import { apiRequest } from "./apiClient";
import { ChatThread, APIChatMessage, PaginatedResponse } from "../types";

function mapMessage(m: any): APIChatMessage {
  return {
    ...m,
    body: m.message_text ?? m.body ?? "",
    message_type: m.message_type ?? 'text',
  };
}

export async function getChatThreads(_userId: string, page = 1, limit = 20) {
  const res = await apiRequest<PaginatedResponse<ChatThread>>(
    `/chat/threads?page=${page}&limit=${limit}`
  );
  return res;
}

export async function getChatMessages(threadId: string, before?: string, limit = 30) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  const res = await apiRequest<{ data: any[]; pagination: { limit: number; hasMore: boolean; oldestId: string | null } }>(
    `/chat/messages/${encodeURIComponent(threadId)}?${params.toString()}`
  );
  return { ...res, data: res.data.map(mapMessage) };
}

export async function sendMessage(
  threadId: string,
  messageText: string,
  _senderId: string,
  opts?: { messageType?: string; refTaskId?: string }
) {
  const msg = await apiRequest<any>("/chat/messages", {
    method: "POST",
    body: {
      thread_id: threadId,
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

export async function markMessagesRead(threadId: string, _readerId?: string) {
  return apiRequest<{ success: boolean }>(`/chat/messages/${encodeURIComponent(threadId)}/read`, {
    method: "PUT",
  });
}
