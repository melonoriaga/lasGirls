export type TaskTimeEntry = {
  id: string;
  taskId: string;
  taskTitle?: string;
  clientId: string;
  clientName?: string;
  userId: string;
  userName?: string;
  date: string;
  assignedMonth: string;
  source: "timer" | "manual";
  status?: "running" | "completed" | "cancelled";
  startedAt?: string;
  endedAt?: string;
  minutes: number;
  seconds?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
};

export type TaskTimeSummaryByUser = {
  userId: string;
  userName: string;
  minutes: number;
  percentage: number;
};

export type TaskTimeSummaryByTask = {
  taskId: string;
  taskTitle: string;
  minutes: number;
};

