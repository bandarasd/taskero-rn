import { apiRequest } from "./apiClient";
import { Review, PaginatedResponse } from "../types";

export async function getTaskerReviews(taskerId: string, page = 1, limit = 10) {
  return apiRequest<PaginatedResponse<Review>>(
    `/reviews/tasker/${encodeURIComponent(taskerId)}?page=${page}&limit=${limit}`
  );
}

export async function getGigReviews(gigId: string, page = 1, limit = 10) {
  return apiRequest<PaginatedResponse<Review>>(
    `/reviews/gig/${encodeURIComponent(gigId)}?page=${page}&limit=${limit}`
  );
}

export async function getTaskReviews(taskId: string, page = 1, limit = 10) {
  return apiRequest<PaginatedResponse<Review>>(
    `/reviews/task/${encodeURIComponent(taskId)}?page=${page}&limit=${limit}`
  );
}

export async function createReview(payload: {
  task_id?: string;
  gig_id?: string;
  tasker_id: string;
  rating: number;
  body?: string;
}) {
  return apiRequest<Review>("/reviews", { method: "POST", body: payload });
}
