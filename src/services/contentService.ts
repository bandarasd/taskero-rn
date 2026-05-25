import { apiRequest } from "./apiClient";

export type BookingField = {
  key: string;
  label: string;
  placeholder: string;
  helper?: string;
  type: "text" | "number-chips" | "options-chips";
  options?: string[];
};

export type ServiceCategoryData = {
  id: string;
  name: string;
  icon: string;
  requires_certification: boolean;
  image_url: string | null;
  booking_fields: BookingField[];
  cert_requirements: string[];
  cert_description: string;
  sort_order: number;
};

export type FaqItem = {
  id: string;
  title: string;
  body: { answer: string };
  sort_order: number;
};

export type PromoItem = {
  id: string;
  title: string;
  body: { subtitle: string; color: string; icon: string };
  sort_order: number;
};

export type ReviewTagItem = {
  id: string;
  title: string;
  sort_order: number;
};

export async function fetchCategories(): Promise<ServiceCategoryData[]> {
  const data = await apiRequest<{ categories: ServiceCategoryData[] }>("/categories");
  return data.categories;
}

export async function fetchFaqs(): Promise<FaqItem[]> {
  const data = await apiRequest<{ items: FaqItem[] }>("/content/faqs");
  return data.items;
}

export async function fetchPromos(): Promise<PromoItem[]> {
  const data = await apiRequest<{ items: PromoItem[] }>("/content/promos");
  return data.items;
}

export async function fetchReviewTags(): Promise<ReviewTagItem[]> {
  const data = await apiRequest<{ items: ReviewTagItem[] }>("/content/review-tags");
  return data.items;
}
