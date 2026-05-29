import { apiRequest } from "./apiClient";
import { TaskerSchedule, TaskerSchedulePayloadEntry, AvailableTimePrefResponse } from "../types";

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const DAY_NAME: Record<number, string> = {
  0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday",
  4: "thursday", 5: "friday", 6: "saturday",
};

export async function getSchedule(taskerId: string): Promise<TaskerSchedule> {
  const rows = await apiRequest<any[]>(`/taskers/${encodeURIComponent(taskerId)}/schedule`);
  return rows.map((row) => ({
    day: DAY_NAME[row.day_of_week],
    is_available: row.is_active,
    morning_available: row.morning_available ?? true,
    afternoon_available: row.afternoon_available ?? true,
    evening_available: row.evening_available ?? true,
  })) as TaskerSchedule;
}

export async function updateSchedule(taskerId: string, schedule: TaskerSchedule) {
  const payload: TaskerSchedulePayloadEntry[] = schedule.map((entry) => ({
    day_of_week: DAY_INDEX[entry.day],
    is_active: entry.is_available,
    morning_available: entry.morning_available,
    afternoon_available: entry.afternoon_available,
    evening_available: entry.evening_available,
  }));

  return apiRequest<TaskerSchedulePayloadEntry[]>(
    `/taskers/${encodeURIComponent(taskerId)}/schedule`,
    { method: "PUT", body: payload }
  );
}

// No-op: buffer_minutes was removed from the schema when switching to time-preference slots.
// Kept for API compatibility until WorkerSettingsScreen is updated.
export async function updateGracePeriod(_taskerId: string, _minutes: number) {
  return Promise.resolve();
}

export async function getAvailableSlots(taskerId: string, date: string) {
  return apiRequest<AvailableTimePrefResponse>(
    `/taskers/${encodeURIComponent(taskerId)}/available-slots?date=${encodeURIComponent(date)}`
  );
}
