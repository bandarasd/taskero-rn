import { apiRequest } from "./apiClient";
import { ChatThread, APIChatMessage } from "../types";

export async function getChatThreads(userId: string) {
  return apiRequest<ChatThread[]>(`/chat/threads/${encodeURIComponent(userId)}`);
}

export async function getChatMessages(threadId: string) {
  return apiRequest<APIChatMessage[]>(`/chat/messages/${encodeURIComponent(threadId)}`);
}

export async function sendMessage(threadId: string, body: string) {
  return apiRequest<APIChatMessage>("/chat/messages", {
    method: "POST",
    body: { thread_id: threadId, body },
  });
}

export async function createThread(customerId: string, taskerId: string, taskId?: string) {
  return apiRequest<ChatThread>("/chat/thread", {
    method: "POST",
    body: { customer_id: customerId, tasker_id: taskerId, task_id: taskId },
  });
}
