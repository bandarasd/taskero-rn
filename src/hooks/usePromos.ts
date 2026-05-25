import { useQuery } from "@tanstack/react-query";
import { fetchPromos, PromoItem } from "../services/contentService";

export function usePromos() {
  return useQuery<PromoItem[]>({
    queryKey: ["promos"],
    queryFn: fetchPromos,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
