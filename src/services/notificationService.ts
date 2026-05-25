import { apiRequest } from "./apiClient";
import { APINotification, PaginatedResponse } from "../types";

export async function registerFCMToken(userId: string, token: string, platform: "ios" | "android") {
  return apiRequest<void>("/notifications/register-token", {
    method: "POST",
    body: { user_id: userId, token, platform },
  });
}

export async function getNotifications(userId: string, page = 1, limit = 20) {
  return apiRequest<PaginatedResponse<APINotification>>(
    `/notifications/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`
  );
}

export async function markNotificationRead(id: string) {
  return apiRequest<APINotification>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/notifications/${encodeURIComponent(userId)}/read-all`, {
    method: "PUT",
  });
}
