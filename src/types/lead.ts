export type LeadPipelineStatus =
  | "new"
  | "contacted"
  | "brief_pending"
  | "budget_pending"
  | "budget_sent"
  | "awaiting_approval"
  | "changes_requested"
  | "docs_pending"
  | "approved"
  | "rejected"
  | "converted"
  | "in_followup"
  | "qualified"
  | "archived";

/** Alias por compatibilidad con servicios/APIs que importan LeadStatus. */
export type LeadStatus = LeadPipelineStatus;

export type BudgetStatus =
  | "not_sent"
  | "sent"
  | "awaiting_response"
  | "approved"
  | "rejected"
  | "needs_changes";

export type LeadBudgetStatus =
  | "sent"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "needs_changes";

export type InquiryType =
  | "consulta_general"
  | "cotizar_servicio"
  | "definir_estrategia"
  | "branding"
  | "sitio_web"
  | "app"
  | "redes_contenido"
  | "marketing_seo"
  | "otro";

export type ProjectStage =
  | "solo_idea"
  | "empezando"
  | "marca_necesita_crecer"
  | "web_app_necesita_mejorar"
  | "acompanamiento_integral"
  | "validando"
  | "listo_para_empezar"
  | "en_proceso";

export type LeadMetadata = {
  userAgent?: string;
  landingPage?: string;
  referrer?: string;
  locale?: string;
  ipCountry?: string;
};

export type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  inquiryType: InquiryType | string;
  serviceInterest: string[];
  budgetRange?: string;
  projectStage: ProjectStage | string;
  message: string;
  source: string;
  preferredContactMethod: "email" | "whatsapp" | "telefono";
  status: LeadPipelineStatus | string;
  budgetStatus?: BudgetStatus | string;
  latestBudgetLink?: string;
  latestBudgetSentAt?: string;
  latestBudgetAmount?: number;
  currency?: "ARS" | "USD" | string;
  missingDocuments?: string[];
  internalNotes?: string;
  assignedTo?: string;
  assignedToUserId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  convertedToClientId?: string;
  metadata: LeadMetadata;
};

export type LeadBudget = {
  id: string;
  title: string;
  link: string;
  amount?: number;
  currency?: "ARS" | "USD";
  sentAt: string;
  status: LeadBudgetStatus | string;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadNoteType =
  | "internal_note"
  | "call_summary"
  | "meeting"
  | "followup";

export type LeadNote = {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  type: LeadNoteType | string;
  pinned: boolean;
};
