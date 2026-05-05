export type TaskPriority = "high" | "medium" | "low";

export type TaskStatus = "pending" | "in_progress" | "blocked" | "done" | "cancelled";

export type ClientTask = {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  clientName?: string;
  assignedTo: string;
  createdBy: string;
  dueDate?: string;
  assignedMonth: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
};
