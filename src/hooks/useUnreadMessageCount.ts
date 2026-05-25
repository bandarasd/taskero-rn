import { useInfiniteQuery } from "@tanstack/react-query";
import { getChatThreads } from "../services/chatService";
import { useAuth } from "../store/authStore";

export function useUnreadMessageCount() {
  const { dbUserId } = useAuth();

  const { data } = useInfiniteQuery({
    queryKey: ["threads", dbUserId],
    queryFn: ({ pageParam = 1 }) => getChatThreads(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
    refetchInterval: 15000,
  });

  const threads = data?.pages.flatMap((p) => p.data) ?? [];
  return threads.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);
}
