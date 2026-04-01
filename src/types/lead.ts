export type LeadStatus =
  | "new"
  | "contacted"
  | "in_followup"
  | "qualified"
  | "archived"
  | "converted";

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
  | "acompanamiento_integral";

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
  inquiryType: InquiryType;
  serviceInterest: string[];
  budgetRange?: string;
  projectStage: ProjectStage;
  message: string;
  source: string;
  preferredContactMethod: "email" | "whatsapp" | "telefono";
  status: LeadStatus;
  assignedTo?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  convertedToClientId?: string;
  metadata: LeadMetadata;
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
  type: LeadNoteType;
  pinned: boolean;
};
