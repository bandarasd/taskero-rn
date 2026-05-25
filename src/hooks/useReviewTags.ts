import { useQuery } from "@tanstack/react-query";
import { fetchReviewTags, ReviewTagItem } from "../services/contentService";

export function useReviewTags() {
  return useQuery<ReviewTagItem[]>({
    queryKey: ["review-tags"],
    queryFn: fetchReviewTags,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
