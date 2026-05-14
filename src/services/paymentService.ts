import { apiRequest } from "./apiClient";
import { Payment } from "../types";

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

export async function getTaskPayments(taskId: string) {
  return apiRequest<Payment[]>(`/payments/task/${encodeURIComponent(taskId)}`);
}

export async function getWorkerPayments(taskerId: string) {
  return apiRequest<Payment[]>(`/payments/tasker/${encodeURIComponent(taskerId)}`);
}
