import { apiRequest } from "./apiClient";
import { Payment, PaginatedResponse } from "../types";

export async function createPaymentIntent(taskId: string, amount: number) {
  return apiRequest<{ client_secret: string; payment_intent_id: string }>(
    "/payments/create-intent",
    { method: "POST", body: { task_id: taskId, amount } }
  );
}

export async function recordPayment(payload: {
  task_id: string;
  customer_id: string;
  tasker_id: string;
  amount: number;
  stripe_payment_intent_id?: string;
}) {
  return apiRequest<Payment>("/payments/record", { method: "POST", body: payload });
}

export async function createOfflinePayment(payload: {
  task_id: string;
  customer_id: string;
  tasker_id: string;
  amount: number;
}) {
  return apiRequest<Payment>("/payments", {
    method: "POST",
    body: { ...payload, payment_method: "offline", currency: "LKR" },
  });
}

export async function getTaskPayments(taskId: string, page = 1, limit = 20) {
  return apiRequest<PaginatedResponse<Payment>>(
    `/payments/task/${encodeURIComponent(taskId)}?page=${page}&limit=${limit}`
  );
}

export async function getWorkerPayments(taskerId: string, page = 1, limit = 20) {
  return apiRequest<PaginatedResponse<Payment>>(
    `/payments/tasker/${encodeURIComponent(taskerId)}?page=${page}&limit=${limit}`
  );
}
