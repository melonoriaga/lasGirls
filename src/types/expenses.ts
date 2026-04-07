/** Módulo gastos compartidos — ver `src/lib/expenses/EXPENSES_MODULE.md`. `id` = UID de Firebase Auth del equipo. */

export type ExpenseMember = {
  id: string;
  name: string;
  email?: string;
  /** @username del perfil admin; mejora reconocimiento entre el equipo */
  username?: string;
  photoURL?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseSplitMode = "equal" | "custom";

export type ParticipantShareType = "percentage" | "fixed";

export type RecurrenceParticipant = {
  memberId: string;
  shareType: ParticipantShareType;
  shareValue: number;
};

export type MovementParticipant = {
  memberId: string;
  shareType: ParticipantShareType;
  shareValue: number;
  computedShareAmount: number;
};

export type ExpenseMovementType = "expense" | "settlement";
export type ExpenseMovementStatus = "active" | "canceled";
export type ExpensePeriodStatus = "open" | "closed";

export type ExpenseRecurrence = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  amount: number;
  currency: string;
  paidByMemberId: string;
  splitMode: ExpenseSplitMode;
  participants: RecurrenceParticipant[];
  frequency: "monthly";
  startMonth: string;
  endMonth: string | null;
  dayOfMonth: number | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  canceledAt?: string | null;
};

export type ExpensePeriod = {
  id: string;
  year: number;
  month: number;
  label: string;
  status: ExpensePeriodStatus;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseMovement = {
  id: string;
  type: ExpenseMovementType;
  status: ExpenseMovementStatus;
  title: string;
  description?: string;
  category?: string;
  amount: number;
  currency: string;
  date: string;
  paidByMemberId?: string;
  splitMode?: ExpenseSplitMode;
  participants?: MovementParticipant[];
  fromMemberId?: string;
  toMemberId?: string;
  recurrenceId?: string | null;
  generatedByRecurrence?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  canceledAt?: string | null;
};

export type MemberBalanceSummary = {
  memberId: string;
  paid: number;
  owedShare: number;
  net: number;
};

export type CurrencyBalanceSummary = {
  currency: string;
  totalExpenses: number;
  members: MemberBalanceSummary[];
  netByMemberId: Record<string, number>;
  narrativeLines: string[];
  isSaldado: boolean;
};

export type PeriodBalanceSummary = {
  periodId: string;
  byCurrency: CurrencyBalanceSummary[];
  overallStatus: "saldado" | "pendiente" | "mixto";
};

export type ExpenseCategory =
  | "dominio"
  | "hosting"
  | "suscripcion"
  | "diseno"
  | "publicidad"
  | "otros";
