import { z } from "zod";

export const rucJuridicaRegex = /^\d{1,3}-\d{3}-\d{6}$/;
export const cedulaPasaporteRegex = /^[A-Za-z0-9-]{4,24}$/;

export const createFormularioSchema = z
  .object({
    proveedor: z.object({
      razonSocial: z.string().min(1),
      ruc: z.string().min(1),
      tipoPersona: z.enum(["natural", "juridica", "extranjera"]),
      paisOrigen: z.string().min(2),
      representanteLegal: z.string().min(1),
      documentoIdentidad: z.string().min(1)
    }),
    datos: z.record(z.any())
  })
  .superRefine((val, ctx) => {
    const { tipoPersona, ruc } = val.proveedor;
    if (tipoPersona === "juridica") {
      if (!rucJuridicaRegex.test(ruc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["proveedor", "ruc"],
          message: "El RUC juridico debe cumplir el formato 0-000-000000"
        });
      }
    } else if (!cedulaPasaporteRegex.test(ruc)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proveedor", "ruc"],
        message: "El RUC o identificacion fiscal no tiene un formato valido"
      });
    }
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
