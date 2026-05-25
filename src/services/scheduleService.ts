import { apiRequest } from "./apiClient";
import { TaskerSchedule, TaskerSchedulePayloadEntry, AvailableSlotsResponse } from "../types";

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
    start_time: row.start_time,
    end_time: row.end_time,
    buffer_minutes: row.buffer_minutes ?? 30,
  })) as TaskerSchedule;
}

export async function updateSchedule(taskerId: string, schedule: TaskerSchedule) {
  const payload: TaskerSchedulePayloadEntry[] = schedule.map((entry) => ({
    day_of_week: DAY_INDEX[entry.day],
    is_active: entry.is_available,
    start_time: entry.start_time ?? "08:00",
    end_time: entry.end_time ?? "18:00",
    buffer_minutes: entry.buffer_minutes ?? 30,
  }));

  return apiRequest<TaskerSchedulePayloadEntry[]>(
    `/taskers/${encodeURIComponent(taskerId)}/schedule`,
    { method: "PUT", body: payload }
  );
}

export async function updateGracePeriod(taskerId: string, minutes: number) {
  const schedule = await getSchedule(taskerId);
  const updated = schedule.map((entry) => ({ ...entry, buffer_minutes: minutes }));
  return updateSchedule(taskerId, updated);
}

export async function getAvailableSlots(taskerId: string, date: string) {
  return apiRequest<AvailableSlotsResponse>(
    `/taskers/${encodeURIComponent(taskerId)}/available-slots?date=${encodeURIComponent(date)}`
  );
}
