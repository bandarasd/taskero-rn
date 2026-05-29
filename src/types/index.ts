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
  completed_jobs?: number | null;
  no_show_cancellations?: number | null;
  cancellation_count?: number | null;
  completion_rate?: number | null;
  firebase_uid?: string | null;
  created_at?: string | null;
};

// ─── Categories ──────────────────────────────────────────────────────────────

export type ServiceCategory = string;

// ─── Visit Tiers ─────────────────────────────────────────────────────────────

export type VisitTier = {
  label: string;
  days: number;
  surcharge_type: 'percent' | 'flat';
  surcharge_value: number;
};

// ─── Gig ─────────────────────────────────────────────────────────────────────

export type Gig = {
  id: string;
  tasker_id: string;
  title: string;
  description?: string | null;
  category: ServiceCategory;
  base_price: number;
  visit_tiers?: VisitTier[];
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
  | "payment_pending"
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
  time_preference?: 'morning' | 'afternoon' | 'evening' | null;
  selected_tier_label?: string | null;
  selected_tier_days?: number | null;
  surcharge_amount?: number | null;
  promised_visit_date?: string | null;
  late_penalty_percent?: number | null;
  late_penalty_amount?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  base_price?: number | null;
  quoted_price?: number | null;
  quote_expires_at?: string | null;
  final_price?: number | null;
  extra_charges?: { description: string; amount: number }[] | null;
  notes?: string | null;
  details?: Record<string, any> | null;
  estimated_duration_minutes?: number | null;
  payment_method?: 'cash' | 'card' | null;
  overrun_notified_at?: string | null;
  delay_response?: 'wait' | 'cancel' | 'reschedule' | null;
  tasker_new_eta?: string | null;
  cancelled_by?: 'customer' | 'worker' | null;
  cancelled_at?: string | null;
  attachments?: string[];
  customer?: ApiUser | null;
  tasker?: ApiUser | null;
  gig?: Gig | null;
  gig_title?: string | null;
  gig_attachments?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

// ─── Schedule ────────────────────────────────────────────────────────────────

export type DayOfWeek = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export type TaskerScheduleEntry = {
  day: DayOfWeek;
  is_available: boolean;
  morning_available: boolean;
  afternoon_available: boolean;
  evening_available: boolean;
};

export type TaskerSchedule = TaskerScheduleEntry[];

// Shape the server expects for PUT /taskers/:id/schedule
export type TaskerSchedulePayloadEntry = {
  day_of_week: number; // 0=Sunday … 6=Saturday
  is_active: boolean;
  morning_available?: boolean;
  afternoon_available?: boolean;
  evening_available?: boolean;
};

export type TimePreference = 'morning' | 'afternoon' | 'evening';

export type AvailableTimePrefResponse = {
  available: boolean;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  pending_count?: { morning: number; afternoon: number; evening: number };
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
  message_type: 'text' | 'booking_ref';
  ref_task_id?: string | null;
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

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type APINotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  type?: string | null;
  data?: Record<string, unknown> | null;
  created_at?: string;
};
