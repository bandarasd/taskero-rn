import { apiRequest } from "./apiClient";
import { Gig, ServiceCategory } from "../types";

export async function getGigs() {
  return apiRequest<Gig[]>("/gigs");
}

export async function getGigById(id: string) {
  return apiRequest<Gig>(`/gigs/${encodeURIComponent(id)}`);
}

export async function getGigsByCategory(category: ServiceCategory) {
  return apiRequest<Gig[]>(`/gigs/category/${encodeURIComponent(category)}`);
}

export async function getWorkerGigs(taskerId: string) {
  return apiRequest<Gig[]>(`/gigs/tasker/${encodeURIComponent(taskerId)}`);
}

export async function searchGigs(query: string) {
  return apiRequest<Gig[]>(`/search/gigs/search?q=${encodeURIComponent(query)}`);
}

export async function createGig(payload: Partial<Gig>) {
  return apiRequest<Gig>("/gigs", { method: "POST", body: payload });
}

export async function updateGig(id: string, payload: Partial<Gig>) {
  return apiRequest<Gig>(`/gigs/${encodeURIComponent(id)}`, { method: "PUT", body: payload });
}

export async function patchGigStatus(id: string, status: "active" | "paused") {
  return apiRequest<Gig>(`/gigs/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export async function deleteGig(id: string) {
  return apiRequest<void>(`/gigs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
