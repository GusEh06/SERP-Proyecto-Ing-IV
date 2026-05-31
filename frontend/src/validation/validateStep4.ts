import type { RiskData } from "../types";

export function validateStep4(data: RiskData): string[] {
  const errors: string[] = [];

  if (!data.esPaisGafi) errors.push("Debe indicar si el proveedor opera en pais GAFI de alto riesgo");
  if (!data.esPep) errors.push("Debe indicar si el proveedor es PEP");
  if (!data.montoRango) errors.push("Debe indicar el monto anual estimado");
  if (!data.nivelRiesgo) errors.push("Debe calcularse el nivel de riesgo antes de continuar");

  return errors;
}
