import { useQuery } from "@tanstack/react-query";
import { fetchFaqs, FaqItem } from "../services/contentService";

export function useFaqs() {
  return useQuery<FaqItem[]>({
    queryKey: ["faqs"],
    queryFn: fetchFaqs,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
