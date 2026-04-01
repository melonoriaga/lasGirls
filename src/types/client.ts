export type ClientStatus = "active" | "paused" | "completed" | "archived";

export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "recurring";

export type BillingModel = "one_time" | "monthly_retainer" | "hybrid";

export type ClientPricing = {
  currency: string;
  amount: number;
  recurrence?: string;
  notes?: string;
};

export type Client = {
  id: string;
  originLeadId?: string;
  displayName: string;
  legalName?: string;
  email: string;
  phone?: string;
  company?: string;
  brandName?: string;
  country?: string;
  industry?: string;
  status: ClientStatus;
  assignedTeam: string[];
  servicesContracted: string[];
  projectSummary?: string;
  billingModel: BillingModel;
  contractSigned: boolean;
  invoicingRequired: boolean;
  invoiceData?: Record<string, string>;
  paymentStatus: PaymentStatus;
  pricing: ClientPricing;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
};

export type ClientNote = {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  type: string;
  pinned: boolean;
};

export type ClientService = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  price: number;
  currency: string;
  billingModel: BillingModel;
  startDate?: string;
  dueDate?: string;
  deliveredAt?: string;
};
