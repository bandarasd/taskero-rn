import { apiRequest } from "./apiClient";
import { APITask, TaskStatus } from "../types";

export async function getCustomerTasks(customerId: string) {
  return apiRequest<APITask[]>(`/tasks/customer/${encodeURIComponent(customerId)}`);
}

export async function getWorkerTasks(taskerId: string) {
  return apiRequest<APITask[]>(`/tasks/tasker/${encodeURIComponent(taskerId)}`);
}

export async function getTaskById(id: string) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}`);
}

export async function createTask(payload: Partial<APITask>) {
  return apiRequest<APITask>("/tasks", { method: "POST", body: payload });
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: { status },
  });
}

export async function submitQuote(id: string, price: number, notes?: string) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}/quote`, {
    method: "PUT",
    body: { price, notes },
  });
}

export async function respondToQuote(id: string, accepted: boolean) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}/quote/respond`, {
    method: "PUT",
    body: { action: accepted ? "accept" : "reject" },
  });
}

export async function rescheduleTask(id: string, scheduledAt: string) {
  return apiRequest<APITask>(`/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { scheduled_at: scheduledAt },
  });
}
