import { useQuery } from "@tanstack/react-query";
import { getChatThreads } from "../services/chatService";
import { useAuth } from "../store/authStore";

export function useUnreadMessageCount() {
  const { dbUserId } = useAuth();

  const { data: threads } = useQuery({
    queryKey: ["threads", dbUserId],
    queryFn: () => getChatThreads(dbUserId!),
    enabled: !!dbUserId,
    refetchInterval: 15000,
  });

  return threads?.reduce((sum, t) => sum + (t.unread_count ?? 0), 0) ?? 0;
}
