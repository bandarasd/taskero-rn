import { apiRequest } from "./apiClient";
import { Review } from "../types";

export async function getTaskerReviews(taskerId: string) {
  return apiRequest<Review[]>(`/review/tasker/${encodeURIComponent(taskerId)}`);
}

export async function getGigReviews(gigId: string) {
  return apiRequest<Review[]>(`/review/gig/${encodeURIComponent(gigId)}`);
}

export async function createReview(payload: {
  task_id?: string;
  gig_id?: string;
  tasker_id: string;
  rating: number;
  body?: string;
}) {
  return apiRequest<Review>("/review", { method: "POST", body: payload });
}
