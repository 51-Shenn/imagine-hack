import type { OperationsTask } from "@/lib/operations-types";

type TaskTiming = Pick<OperationsTask, "state" | "scheduledStart" | "earliestStart" | "estimatedDurationHours">;

function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, "");
}

export function formatTaskTiming(task: TaskTiming) {
  if (task.state === "COMPLETE") return "Completed";
  if (task.state === "FAILED") return "Failed";

  const startValue = task.scheduledStart ?? task.earliestStart;
  if (startValue) {
    const start = new Date(startValue);
    if (!Number.isNaN(start.getTime())) {
      const finish = new Date(start.getTime() + task.estimatedDurationHours * 3_600_000);
      return `ETA ${finish.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  }

  return `Est. duration ${formatHours(task.estimatedDurationHours)}h`;
}
