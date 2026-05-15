// ─── User ────────────────────────────────────────────────────────────────────

export type ApiUser = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  role?: "customer" | "worker" | string | null;
  avatar_url?: string | null;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  service_radius?: number | null;
  bio?: string | null;
  rating?: number | null;
  review_count?: number | null;
  firebase_uid?: string | null;
  created_at?: string | null;
};

// ─── Categories ──────────────────────────────────────────────────────────────

export type ServiceCategory =
  | "Cleaning"
  | "Plumbing"
  | "Laundry"
  | "Painting"
  | "Repairing"
  | "Electrician"
  | "Assembly"
  | "Carpentry"
  | "Moving"
  | "Gardening"
  | "General";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Cleaning",
  "Plumbing",
  "Laundry",
  "Painting",
  "Repairing",
  "Electrician",
  "Assembly",
  "Carpentry",
  "Moving",
  "Gardening",
  "General",
];

export const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  Cleaning: "🧹",
  Plumbing: "🔧",
  Laundry: "👕",
  Painting: "🎨",
  Repairing: "🛠️",
  Electrician: "⚡",
  Assembly: "🔩",
  Carpentry: "🪵",
  Moving: "📦",
  Gardening: "🌱",
  General: "✨",
};

// ─── Gig ─────────────────────────────────────────────────────────────────────

export type Gig = {
  id: string;
  tasker_id: string;
  title: string;
  description?: string | null;
  category: ServiceCategory;
  base_price: number;
  status?: "active" | "paused" | string;
  attachments?: string[];
  service_area?: {
    latitude: number;
    longitude: number;
    radius_km: number;
  } | null;
  tasker?: ApiUser | null;
  rating?: number | null;
  review_count?: number | null;
  created_at?: string;
};

// ─── Task / Booking ───────────────────────────────────────────────────────────

export type TaskStatus =
  | "pending"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "completed"
  | "canceled"
  | "declined";

export type APITask = {
  id: string;
  gig_id?: string | null;
  customer_id: string;
  tasker_id?: string | null;
  status: TaskStatus;
  title?: string | null;
  description?: string | null;
  category?: ServiceCategory | string | null;
  location_address?: string | null;
  location_latitude?: number | null;
  location_longitude?: number | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
  base_price?: number | null;
  quoted_price?: number | null;
  final_price?: number | null;
  notes?: string | null;
  attachments?: string[];
  customer?: ApiUser | null;
  tasker?: ApiUser | null;
  gig?: Gig | null;
  gig_title?: string | null;
  created_at?: string;
  updated_at?: string;
};

// ─── Schedule ────────────────────────────────────────────────────────────────

export type DayOfWeek = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export type TaskerScheduleEntry = {
  day: DayOfWeek;
  is_available: boolean;
  start_time?: string | null; // "HH:mm"
  end_time?: string | null;   // "HH:mm"
};

export type TaskerSchedule = TaskerScheduleEntry[];

// Shape the server expects for PUT /taskers/:id/schedule
export type TaskerSchedulePayloadEntry = {
  day_of_week: number; // 0=Sunday … 6=Saturday
  is_active: boolean;
  start_time: string;
  end_time: string;
  buffer_minutes?: number;
};

export type AvailableSlotsResponse = {
  date: string;
  slots: string[]; // ["09:00", "10:00", ...]
};

// ─── Review ──────────────────────────────────────────────────────────────────

export type Review = {
  id: string;
  task_id?: string | null;
  gig_id?: string | null;
  reviewer_id: string;
  tasker_id: string;
  rating: number;
  body?: string | null;
  reviewer?: ApiUser | null;
  created_at?: string;
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatThread = {
  id: string;
  customer_id: string;
  tasker_id: string;
  task_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
  customer?: ApiUser | null;
  tasker?: ApiUser | null;
  created_at?: string;
};

export type APIChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: ApiUser | null;
};

// ─── Payment ──────────────────────────────────────────────────────────────────

export type Payment = {
  id: string;
  task_id: string;
  customer_id: string;
  tasker_id: string;
  amount: number;
  currency?: string;
  status?: "pending" | "succeeded" | "failed" | string;
  stripe_payment_intent_id?: string | null;
  created_at?: string;
};

// ─── Notification ─────────────────────────────────────────────────────────────

export type APINotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  type?: string | null;
  reference_id?: string | null;
  created_at?: string;
};
