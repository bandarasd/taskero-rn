import { useQuery } from "@tanstack/react-query";
import { fetchCategories, ServiceCategoryData } from "../services/contentService";

export function useCategories() {
  return useQuery<ServiceCategoryData[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60 * 60 * 1000, // 1 hour — categories rarely change
  });
}

export function useCategoryByName(name: string | undefined) {
  const { data: categories, ...rest } = useCategories();
  const category = categories?.find((c) => c.name === name) ?? null;
  return { data: category, ...rest };
}
