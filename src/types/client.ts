export type ClientStatus =
  | "active"
  | "paused"
  | "pending_onboarding"
  | "inactive"
  | "archived"
  | "completed";

export type ClientOnboardingStatus = "pending" | "in_progress" | "completed";

export type BillingType = "monthly" | "one_time" | "hourly" | "custom" | "monthly_retainer" | "hybrid";

export type InvoiceStatus = "not_sent" | "sent" | "paid" | "overdue" | "draft" | "cancelled";

/** Legado desde el modelo anterior */
export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "recurring";

export type ClientType = "one_time" | "recurring" | "vip" | "internal";

export type BillingFrequency = "monthly" | "biweekly" | "per_project" | "per_milestone" | "custom";

export type ClientHealth = "healthy" | "at_risk" | "delayed" | "inactive";

export type ClientPricing = {
  currency: string;
  amount: number;
  recurrence?: string;
  notes?: string;
};

export type Client = {
  id: string;
  leadId?: string | null;
  originLeadId?: string;
  fullName?: string;
  displayName?: string;
  legalName?: string;
  email: string;
  phone?: string;
  company?: string;
  brandName?: string;
  country?: string;
  industry?: string;
  status: ClientStatus | string;
  assignedTeam?: string[];
  serviceType?: string[];
  servicesContracted?: string[];
  projectSummary?: string;
  billingType?: BillingType | string;
  billingModel?: BillingType | string;
  contractSigned?: boolean;
  invoicingRequired?: boolean;
  invoiceData?: Record<string, string>;
  paymentStatus?: PaymentStatus | string;
  pricing?: ClientPricing;
  onboardingStatus?: ClientOnboardingStatus | string;
  monthlyFee?: number;
  currency?: string;
  lastInvoiceSentAt?: string | null;
  lastInvoiceLink?: string | null;
  invoiceStatus?: InvoiceStatus | string;
  nextInvoiceDate?: string;
  accountManagerUserId?: string;
  clientType?: ClientType | string;
  billingFrequency?: BillingFrequency | string;
  health?: ClientHealth | string;
  tags?: string[];
  usefulLinksCount?: number;
  notesCount?: number;
  invoicesCount?: number;
  paymentsCount?: number;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  documents?: string[];
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
};

export type ClientLinkCategory =
  | "drive"
  | "slides"
  | "sheets"
  | "figma"
  | "invoice"
  | "brief"
  | "assets"
  | "other";

export type ClientLink = {
  id: string;
  title: string;
  url: string;
  category: ClientLinkCategory | string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
};

export type ClientInvoice = {
  id: string;
  periodLabel: string;
  invoiceNumber?: string;
  amount: number;
  currency: "ARS" | "USD" | string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | string;
  sentAt?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  invoiceLink?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
};

export type PaymentSplit = {
  userId: string;
  amount: number;
  percentage?: number;
};

export type ClientPayment = {
  id: string;
  periodLabel?: string;
  totalAmount: number;
  currency: "ARS" | "USD" | string;
  receivedAt: string;
  paymentType: "full_to_one_person" | "split_between_people" | "custom_split" | string;
  receivedByUserId?: string | null;
  splits: PaymentSplit[];
  relatedInvoiceId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
};

export type ClientNoteType = "general" | "meeting" | "billing" | "onboarding" | "warning";

export type ClientNote = {
  id: string;
  content: string;
  type: ClientNoteType | string;
  createdAt: string;
  updatedAt?: string;
  createdByUserId?: string;
  createdBy?: string;
  pinned?: boolean;
};

export type ClientActivityAction =
  | "client_created"
  | "client_updated"
  | "client_deactivated"
  | "client_reactivated"
  | "client_deleted"
  | "invoice_created"
  | "invoice_updated"
  | "payment_recorded"
  | "link_added"
  | "note_added";

export type ClientActivity = {
  id: string;
  action: ClientActivityAction | string;
  message?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdByUserId?: string;
};

/** Helper: nombre mostrable con fallback legado (acepta docs crudos de Firestore). */
export function getClientDisplayName(client: Record<string, unknown>): string {
  const fn = client.fullName ?? client.displayName ?? client.email;
  return typeof fn === "string" && fn ? fn : "Cliente";
}
