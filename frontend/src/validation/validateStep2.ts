import type { EconomicData } from "../types";

export function validateStep2(data: EconomicData): string[] {
  const errors: string[] = [];

  if (!data.actividadPrincipal.trim()) errors.push("La actividad principal es obligatoria");
  if (!data.descripcionServicio.trim()) errors.push("La descripcion del servicio es obligatoria");
  if (!data.beneficiarioFinal.trim()) errors.push("El beneficiario final es obligatorio");
  if (data.ciiu && !/^\d{1,6}$/.test(data.ciiu)) errors.push("El codigo CIIU debe contener solo digitos");

  return errors;
}
