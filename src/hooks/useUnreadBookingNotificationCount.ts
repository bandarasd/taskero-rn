import { useInfiniteQuery } from "@tanstack/react-query";
import { getNotifications } from "../services/notificationService";
import { useAuth } from "../store/authStore";

const BOOKING_TYPES = new Set(["booking", "quote", "status", "delay"]);

export function useUnreadBookingNotificationCount() {
  const { dbUserId } = useAuth();

  const { data } = useInfiniteQuery({
    queryKey: ["notifications", dbUserId],
    queryFn: ({ pageParam = 1 }) => getNotifications(dbUserId!, pageParam, 20),
    getNextPageParam: (last) => last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!dbUserId,
    refetchInterval: 15000,
  });

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];
  return notifications.filter((n) => !n.is_read && BOOKING_TYPES.has(n.type ?? "")).length;
}
