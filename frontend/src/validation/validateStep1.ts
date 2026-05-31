import type { ProviderData } from "../types";

export const rucJuridicaRegex = /^\d{1,3}-\d{3}-\d{6}$/;
const cedulaPasaporteRegex = /^[A-Za-z0-9-]{4,24}$/;

export function validateStep1(data: ProviderData): string[] {
  const errors: string[] = [];

  if (!data.razonSocial.trim()) errors.push("La razon social es obligatoria");
  if (!data.ruc.trim()) errors.push("El RUC o identificacion fiscal es obligatorio");
  if (!data.tipoPersona) errors.push("El tipo de persona es obligatorio");
  if (!data.paisOrigen.trim()) errors.push("El pais de origen es obligatorio");
  if (!data.fechaVerificacion) errors.push("La fecha de verificacion es obligatoria");
  if (!data.representanteLegal.trim()) errors.push("El representante legal es obligatorio");
  if (!data.documentoIdentidad.trim()) errors.push("El documento del representante es obligatorio");

  if (data.tipoPersona === "juridica" && data.ruc && !rucJuridicaRegex.test(data.ruc)) {
    errors.push("El RUC juridico debe cumplir el formato 0-000-000000");
  }

  if (data.tipoPersona !== "juridica" && data.documentoIdentidad && !cedulaPasaporteRegex.test(data.documentoIdentidad)) {
    errors.push("El formato del documento de identidad no es valido");
  }

  return errors;
}
