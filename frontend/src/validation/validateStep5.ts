import type { DocumentsData } from "../types";

export function validateStep5(data: DocumentsData): string[] {
  const errors: string[] = [];
  const allDocumentsChecked = Object.values(data).every(Boolean);

  if (!allDocumentsChecked) {
    errors.push("Debe confirmar los cinco documentos obligatorios");
  }

  return errors;
}
