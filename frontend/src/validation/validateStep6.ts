import type { SignatureData } from "../types";

export function validateStep6(data: SignatureData): string[] {
  const errors: string[] = [];

  if (!data.nombreAnalista.trim()) errors.push("El nombre del analista es obligatorio");
  if (!data.cargoAnalista.trim()) errors.push("El cargo del analista es obligatorio");
  if (!data.fechaAnalisis) errors.push("La fecha del analisis es obligatoria");
  if (!data.firmaAceptada) errors.push("Debe confirmar la firma del analista");

  return errors;
}
