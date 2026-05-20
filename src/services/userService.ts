import { apiRequest, apiUpload } from "./apiClient";
import { ApiUser } from "../types";

export type { ApiUser };

export async function getUserByFirebaseUid(uid: string) {
  return apiRequest<ApiUser>(`/users/firebase/${encodeURIComponent(uid)}`);
}

export async function getUserByPhone(phone: string) {
  return apiRequest<ApiUser>(`/users/phone/${encodeURIComponent(phone)}`);
}

export async function getUserById(id: string) {
  return apiRequest<ApiUser>(`/users/${encodeURIComponent(id)}`);
}

export async function createUser(payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  role: "customer" | "worker";
}) {
  return apiRequest<ApiUser>("/users", { method: "POST", body: payload });
}

export async function updateUser(id: string, payload: Partial<ApiUser>) {
  return apiRequest<ApiUser>(`/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: payload,
  });
}

export async function uploadAvatar(userId: string, imageUri: string): Promise<ApiUser> {
  const formData = new FormData();
  formData.append("profilePicture", {
    uri: imageUri,
    type: "image/jpeg",
    name: "avatar.jpg",
  } as any);
  return apiUpload<ApiUser>(`/users/${encodeURIComponent(userId)}/upload-avatar`, formData);
}
