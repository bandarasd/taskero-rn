import { apiRequest, apiUpload } from "./apiClient";
import { Gig, ServiceCategory, PaginatedResponse } from "../types";

export type GigServiceArea = {
  latitude: number;
  longitude: number;
  radius_km: number;
};

export type CreateGigPayload = {
  tasker_id: string;
  title: string;
  description?: string;
  category: ServiceCategory;
  base_price: number;
  imageUris?: string[];
  serviceArea?: GigServiceArea | null;
};

export type UpdateGigPayload = {
  title?: string;
  description?: string;
  category?: ServiceCategory;
  base_price?: number;
  imageUris?: string[];
  existingAttachments?: string[];
  serviceArea?: GigServiceArea | null;
};

export async function getGigs(page = 1, limit = 15) {
  return apiRequest<PaginatedResponse<Gig>>(`/gigs?page=${page}&limit=${limit}`);
}

export async function getGigById(id: string) {
  return apiRequest<Gig>(`/gigs/${encodeURIComponent(id)}`);
}

export async function getGigsByCategory(category: ServiceCategory, page = 1, limit = 15) {
  return apiRequest<PaginatedResponse<Gig>>(
    `/gigs/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`
  );
}

export async function getWorkerGigs(taskerId: string, page = 1, limit = 20) {
  return apiRequest<PaginatedResponse<Gig>>(
    `/gigs/tasker/${encodeURIComponent(taskerId)}?page=${page}&limit=${limit}`
  );
}

export async function searchGigs(query: string, page = 1, limit = 15) {
  return apiRequest<PaginatedResponse<Gig>>(
    `/search/gigs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  );
}

export async function createGig(payload: CreateGigPayload): Promise<Gig> {
  const { imageUris, serviceArea, ...fields } = payload;

  const fd = new FormData();
  fd.append("tasker_id", fields.tasker_id);
  fd.append("title", fields.title);
  fd.append("category", fields.category);
  fd.append("base_price", String(fields.base_price));
  if (fields.description) fd.append("description", fields.description);
  if (serviceArea) {
    fd.append("service_area_lat", String(serviceArea.latitude));
    fd.append("service_area_lng", String(serviceArea.longitude));
    fd.append("service_area_radius_km", String(serviceArea.radius_km));
  }
  if (imageUris && imageUris.length > 0) {
    imageUris.forEach((uri, i) => {
      const ext = uri.split(".").pop() ?? "jpg";
      fd.append("images", { uri, name: `image_${i}.${ext}`, type: `image/${ext}` } as any);
    });
  }

  return apiUpload<Gig>("/gigs", fd, "POST");
}

export async function updateGig(id: string, payload: UpdateGigPayload): Promise<Gig> {
  const { imageUris, existingAttachments, serviceArea, ...fields } = payload;

  const fd = new FormData();
  if (fields.title !== undefined) fd.append("title", fields.title);
  if (fields.description !== undefined) fd.append("description", fields.description);
  if (fields.category !== undefined) fd.append("category", fields.category);
  if (fields.base_price !== undefined) fd.append("base_price", String(fields.base_price));
  if (existingAttachments !== undefined) {
    fd.append("existingAttachments", JSON.stringify(existingAttachments));
  }
  if (serviceArea) {
    fd.append("service_area_lat", String(serviceArea.latitude));
    fd.append("service_area_lng", String(serviceArea.longitude));
    fd.append("service_area_radius_km", String(serviceArea.radius_km));
  }
  if (imageUris && imageUris.length > 0) {
    imageUris.forEach((uri, i) => {
      const ext = uri.split(".").pop() ?? "jpg";
      fd.append("images", { uri, name: `image_${i}.${ext}`, type: `image/${ext}` } as any);
    });
  }

  return apiUpload<Gig>(`/gigs/${encodeURIComponent(id)}`, fd, "PUT");
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
