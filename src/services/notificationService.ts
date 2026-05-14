import { apiRequest } from "./apiClient";
import { APINotification } from "../types";

export async function registerFCMToken(userId: string, token: string, platform: "ios" | "android") {
  return apiRequest<void>("/notifications/register-token", {
    method: "POST",
    body: { user_id: userId, token, platform },
  });
}

export async function getNotifications(userId: string) {
  return apiRequest<APINotification[]>(`/notifications/${encodeURIComponent(userId)}`);
}

export async function markNotificationRead(id: string) {
  return apiRequest<APINotification>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PUT",
  });
}
