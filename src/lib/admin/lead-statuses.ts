const PIPELINE_STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  reviewed: "Revisado",
  awaiting_response: "Esperando respuesta",
  lost: "Perdido",
  contacted: "Contactado",
  brief_pending: "Falta brief",
  budget_pending: "Pendiente de presupuesto",
  budget_sent: "Presupuesto enviado",
  awaiting_approval: "Esperando aprobacion",
  changes_requested: "Pide cambios",
  docs_pending: "Faltan documentos",
  approved: "Aprobado",
  rejected: "Rechazado",
  converted: "Convertido a cliente",
  in_followup: "En seguimiento",
  qualified: "Calificado",
  archived: "Archivado",
};

const BUDGET_STATUS_LABELS: Record<string, string> = {
  not_sent: "No enviado",
  sent: "Enviado",
  awaiting_response: "Esperando respuesta",
  approved: "Aprobado",
  rejected: "Rechazado",
  needs_changes: "Requiere cambios",
};

export function leadPipelineStatusLabel(value: string | undefined | null): string {
  const key = String(value ?? "").trim();
  return PIPELINE_STATUS_LABELS[key] ?? (key || "Sin estado");
}

export function leadBudgetStatusLabel(value: string | undefined | null): string {
  const key = String(value ?? "").trim();
  return BUDGET_STATUS_LABELS[key] ?? (key || "Sin estado");
}
