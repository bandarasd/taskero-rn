import { apiRequest, apiUpload } from "./apiClient";
import { APITask, TaskStatus, PaginatedResponse } from "../types";

export async function getCustomerTasks(customerId: string, page = 1, limit = 20) {
  return apiRequest<PaginatedResponse<APITask>>(
    `/tasks/customer/${encodeURIComponent(customerId)}?page=${page}&limit=${limit}`
  );
}

export async function getWorkerTasks(taskerId: string, page = 1, limit = 20) {
  return apiRequest<PaginatedResponse<APITask>>(
    `/tasks/tasker/${encodeURIComponent(taskerId)}?page=${page}&limit=${limit}`
  );
}

export async function getTaskById(id: string) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}`);
}

export async function createTask(payload: Partial<APITask>, imageUris?: string[]) {
  const task = await apiRequest<APITask>("/tasks", { method: "POST", body: payload });
  if (imageUris && imageUris.length > 0) {
    const formData = new FormData();
    imageUris.forEach((uri, i) =>
      formData.append("photos", { uri, type: "image/jpeg", name: `photo_${i}.jpg` } as any)
    );
    // fire-and-forget — don't block booking confirmation on upload
    apiUpload<APITask>(`/tasks/${encodeURIComponent(task.id!)}/attachments`, formData).catch(() => {});
  }
  return task;
}

export async function updateTaskStatus(id: string, status: TaskStatus, finalPrice?: number) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: { status, ...(finalPrice !== undefined ? { final_price: finalPrice } : {}) },
  });
}

export async function submitQuote(id: string, price: number, estimatedDurationMinutes: number, notes?: string) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}/quote`, {
    method: "PUT",
    body: { price, estimated_duration_minutes: estimatedDurationMinutes, notes },
  });
}

export async function respondToQuote(id: string, accepted: boolean) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}/quote/respond`, {
    method: "PUT",
    body: { action: accepted ? "accept" : "reject" },
  });
}

export async function getNextBooking(id: string) {
  return apiRequest<{ buffer_minutes: number; next_booking: { id: string; scheduled_at: string; first_name: string; last_name: string; avatar_url?: string } | null }>(`/tasks/${encodeURIComponent(id)}/next-booking`);
}

export async function reportRunningLate(id: string, extraMinutes: number) {
  return apiRequest<{ ok: boolean; affected: boolean; no_next_booking?: boolean; new_eta: string }>(`/tasks/${encodeURIComponent(id)}/running-late`, {
    method: "POST",
    body: { extra_minutes: extraMinutes },
  });
}

export async function respondToDelay(id: string, action: 'wait' | 'cancel' | 'reschedule') {
  return apiRequest<{ action: string }>(`/tasks/${encodeURIComponent(id)}/delay-response`, {
    method: "POST",
    body: { action },
  });
}

export async function rescheduleTask(id: string, scheduledAt: string) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { scheduled_at: scheduledAt },
  });
}
