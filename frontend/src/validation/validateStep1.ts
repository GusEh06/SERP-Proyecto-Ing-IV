import type { ProviderData } from "../types";

export const rucJuridicaRegex = /^\d{1,3}-\d{3}-\d{6}$/;
const cedulaPasaporteRegex = /^[A-Za-z0-9-]{4,24}$/;

function requireFields(
  checks: [boolean, string][],
  errors: string[]
): void {
  for (const [invalid, message] of checks) {
    if (invalid) errors.push(message);
  }
}

export function validateStep1(data: ProviderData): string[] {
  const errors: string[] = [];

  requireFields(
    [
      [!data.razonSocial.trim(), "La razon social es obligatoria"],
      [!data.ruc.trim(), "El RUC o identificacion fiscal es obligatorio"],
      [!data.tipoPersona, "El tipo de persona es obligatorio"],
      [!data.paisOrigen.trim(), "El pais de origen es obligatorio"],
      [!data.fechaVerificacion, "La fecha de verificacion es obligatoria"],
      [!data.representanteLegal.trim(), "El representante legal es obligatorio"],
      [!data.documentoIdentidad.trim(), "El documento del representante es obligatorio"]
    ],
    errors
  );

  if (data.tipoPersona === "juridica" && data.ruc && !rucJuridicaRegex.test(data.ruc)) {
    errors.push("El RUC juridico debe cumplir el formato 0-000-000000");
  }

  if (data.tipoPersona !== "juridica" && data.documentoIdentidad && !cedulaPasaporteRegex.test(data.documentoIdentidad)) {
    errors.push("El formato del documento de identidad no es valido");
  }

  return errors;
}
