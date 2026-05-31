import { z } from "zod";

export const rucJuridicaRegex = /^\d{1,3}-\d{3}-\d{6}$/;

export const createFormularioSchema = z.object({
  proveedor: z.object({
    razonSocial: z.string().min(1),
    ruc: z.string().regex(rucJuridicaRegex),
    tipoPersona: z.enum(["natural", "juridica", "extranjera"]),
    paisOrigen: z.string().min(2),
    representanteLegal: z.string().min(1),
    documentoIdentidad: z.string().min(1)
  }),
  datos: z.record(z.any())
});

export const updateFormularioSchema = z.object({
  estado: z.enum(["borrador", "en_revision", "aprobado", "rechazado"]).optional(),
  pasoActual: z.number().int().min(1).max(6).optional(),
  datos: z.record(z.any())
});

export const createEvaluacionSchema = z.object({
  formularioId: z.number().int().positive(),
  esPep: z.boolean(),
  esPaisGafi: z.boolean(),
  montoAnualUsd: z.number().nonnegative(),
  coincidenciaLista: z.boolean()
});
