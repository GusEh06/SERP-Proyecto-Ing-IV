import { Hono } from "hono";
import type { Context } from "hono";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { sql } from "../db/client";
import { createEvaluacionSchema, createFormularioSchema, updateFormularioSchema } from "../validation/form";
import { calculateRisk } from "../services/scoring.service";
import { writeAuditLog } from "../services/audit.service";

export const formRoute = new Hono();

function getClientIp(c: Context): string | undefined {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return c.req.header("x-real-ip") ?? undefined;
}

async function createFormularioRecord(input: {
  proveedor: {
    razonSocial: string;
    ruc: string;
    tipoPersona: string;
    paisOrigen: string;
    representanteLegal: string;
    documentoIdentidad: string;
  };
  datos: unknown;
}) {
  const [proveedorRow] = await sql<{ id: number }[]>`
    INSERT INTO proveedor (razon_social, ruc, tipo_persona, pais_origen, rep_legal, doc_identidad)
    VALUES (
      ${input.proveedor.razonSocial},
      ${input.proveedor.ruc},
      ${input.proveedor.tipoPersona},
      ${input.proveedor.paisOrigen},
      ${input.proveedor.representanteLegal},
      ${input.proveedor.documentoIdentidad}
    )
    RETURNING id
  `;

  const [formulario] = await sql<{ id: number; estado: string; paso_actual: number }[]>`
    INSERT INTO formulario_evaluacion (proveedor_id, datos_json)
    VALUES (${proveedorRow.id}, ${JSON.stringify(input.datos)}::jsonb)
    RETURNING id, estado, paso_actual
  `;

  return {
    proveedorId: proveedorRow.id,
    id: formulario.id,
    estado: formulario.estado,
    pasoActual: formulario.paso_actual
  };
}

function parseAmountFromRange(range: string | undefined): number {
  if (!range) return 0;
  if (range === "+500k") return 500001;
  if (range === "100k-500k") return 100000;
  if (range === "25k-100k") return 25001;
  if (range === "5k-25k") return 5000;
  return 0;
}

function hasRestrictiveListMatch(listas: unknown): boolean {
  if (!listas || typeof listas !== "object") return false;
  return Object.values(listas as Record<string, unknown>).some((value) => value === "si");
}

formRoute.post("/public/formulario", async (c) => {
  const ip = getClientIp(c);

  const body = await c.req.json().catch(() => null);
  const parsed = createFormularioSchema.safeParse(body);

  if (!parsed.success) {
    await writeAuditLog({
      usuarioId: 0,
      rol: "sistema",
      accion: "POST /api/public/formulario",
      recursoTipo: "formulario_evaluacion",
      resultado: "fallo",
      ipAddress: ip
    });
    return c.json({ message: "Bad request", issues: parsed.error.issues }, 400);
  }

  try {
    const created = await createFormularioRecord({
      proveedor: parsed.data.proveedor,
      datos: parsed.data.datos
    });

    const datos = parsed.data.datos as {
      riesgo?: {
        esPep?: "si" | "no" | "";
        esPaisGafi?: "si" | "no" | "";
        montoRango?: string;
      };
      listas?: Record<string, string>;
    };

    const riskInput = {
      esPep: datos.riesgo?.esPep === "si",
      esPaisGafi: datos.riesgo?.esPaisGafi === "si",
      montoAnualUsd: parseAmountFromRange(datos.riesgo?.montoRango),
      coincidenciaLista: hasRestrictiveListMatch(datos.listas)
    };

    const risk = calculateRisk(riskInput);

    await sql`
      INSERT INTO evaluacion_riesgo (formulario_id, puntaje_total, nivel_riesgo, es_pep, es_pais_gafi, monto_rango)
      VALUES (
        ${created.id},
        ${risk.score},
        ${risk.level},
        ${riskInput.esPep},
        ${riskInput.esPaisGafi},
        ${datos.riesgo?.montoRango ?? ''}
      )
      ON CONFLICT (formulario_id)
      DO UPDATE SET
        puntaje_total = EXCLUDED.puntaje_total,
        nivel_riesgo = EXCLUDED.nivel_riesgo,
        es_pep = EXCLUDED.es_pep,
        es_pais_gafi = EXCLUDED.es_pais_gafi,
        monto_rango = EXCLUDED.monto_rango
    `;

    await writeAuditLog({
      usuarioId: 0,
      rol: "sistema",
      accion: "POST /api/public/formulario",
      recursoTipo: "formulario_evaluacion",
      recursoId: created.id,
      resultado: "exito",
      ipAddress: ip
    });

    return c.json(
      {
        ...created,
        evaluacion: {
          puntaje: risk.score,
          nivelRiesgo: risk.level
        }
      },
      201
    );
  } catch {
    await writeAuditLog({
      usuarioId: 0,
      rol: "sistema",
      accion: "POST /api/public/formulario",
      recursoTipo: "formulario_evaluacion",
      resultado: "fallo",
      ipAddress: ip
    });
    return c.json({ message: "Internal server error" }, 500);
  }
});

formRoute.use("*", authMiddleware);

formRoute.post(
  "/formulario",
  requireRoles(["proveedor", "analista", "oficial_cumplimiento", "administrador"]),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json().catch(() => null);
    const parsed = createFormularioSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuditLog({
        usuarioId: user.id,
        rol: user.role,
        accion: "POST /api/formulario",
        recursoTipo: "formulario_evaluacion",
        resultado: "fallo"
      });
      return c.json({ message: "Bad request", issues: parsed.error.issues }, 400);
    }

    const formulario = await createFormularioRecord({
      proveedor: parsed.data.proveedor,
      datos: parsed.data.datos
    });

    await writeAuditLog({
      usuarioId: user.id,
      rol: user.role,
      accion: "POST /api/formulario",
      recursoTipo: "formulario_evaluacion",
      recursoId: formulario.id,
      resultado: "exito"
    });

    return c.json(
      {
        id: formulario.id,
        estado: formulario.estado,
        pasoActual: formulario.pasoActual,
        proveedorId: formulario.proveedorId
      },
      201
    );
  }
);

formRoute.put(
  "/formulario/:id",
  requireRoles(["proveedor", "analista", "oficial_cumplimiento", "administrador"]),
  async (c) => {
    const user = c.get("user");
    const formularioId = Number(c.req.param("id"));
    const body = await c.req.json().catch(() => null);
    const parsed = updateFormularioSchema.safeParse(body);

    if (!Number.isInteger(formularioId) || formularioId <= 0) {
      return c.json({ message: "Invalid formulario id" }, 400);
    }

    if (!parsed.success) {
      await writeAuditLog({
        usuarioId: user.id,
        rol: user.role,
        accion: "PUT /api/formulario/:id",
        recursoTipo: "formulario_evaluacion",
        recursoId: formularioId,
        resultado: "fallo"
      });
      return c.json({ message: "Bad request", issues: parsed.error.issues }, 400);
    }

    const [formulario] = await sql<{ id: number; estado: string; paso_actual: number; datos_json: object }[]>`
      UPDATE formulario_evaluacion
      SET
        estado = COALESCE(${parsed.data.estado ?? null}, estado),
        paso_actual = COALESCE(${parsed.data.pasoActual ?? null}, paso_actual),
        datos_json = ${JSON.stringify(parsed.data.datos)}::jsonb,
        updated_at = NOW()
      WHERE id = ${formularioId}
      RETURNING id, estado, paso_actual, datos_json
    `;

    if (!formulario) {
      return c.json({ message: "Not found" }, 404);
    }

    await writeAuditLog({
      usuarioId: user.id,
      rol: user.role,
      accion: "PUT /api/formulario/:id",
      recursoTipo: "formulario_evaluacion",
      recursoId: formulario.id,
      resultado: "exito"
    });

    return c.json({
      id: formulario.id,
      estado: formulario.estado,
      pasoActual: formulario.paso_actual,
      datos: formulario.datos_json
    });
  }
);

formRoute.post(
  "/evaluacion",
  requireRoles(["proveedor", "analista", "oficial_cumplimiento", "administrador"]),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json().catch(() => null);
    const parsed = createEvaluacionSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuditLog({
        usuarioId: user.id,
        rol: user.role,
        accion: "POST /api/evaluacion",
        recursoTipo: "evaluacion_riesgo",
        resultado: "fallo"
      });
      return c.json({ message: "Bad request", issues: parsed.error.issues }, 400);
    }

    const { formularioId, esPep, esPaisGafi, montoAnualUsd, coincidenciaLista } = parsed.data;
    const risk = calculateRisk({ esPep, esPaisGafi, montoAnualUsd, coincidenciaLista });

    const [formulario] = await sql<{ id: number }[]>`
      SELECT id
      FROM formulario_evaluacion
      WHERE id = ${formularioId}
      LIMIT 1
    `;

    if (!formulario) {
      return c.json({ message: "Formulario not found" }, 404);
    }

    const [evaluacion] = await sql<{ id: number; puntaje_total: number; nivel_riesgo: "BAJO" | "MEDIO" | "ALTO" }[]>`
      INSERT INTO evaluacion_riesgo (formulario_id, puntaje_total, nivel_riesgo, es_pep, es_pais_gafi, monto_rango)
      VALUES (
        ${formularioId},
        ${risk.score},
        ${risk.level},
        ${esPep},
        ${esPaisGafi},
        ${String(montoAnualUsd)}
      )
      ON CONFLICT (formulario_id)
      DO UPDATE SET
        puntaje_total = EXCLUDED.puntaje_total,
        nivel_riesgo = EXCLUDED.nivel_riesgo,
        es_pep = EXCLUDED.es_pep,
        es_pais_gafi = EXCLUDED.es_pais_gafi,
        monto_rango = EXCLUDED.monto_rango
      RETURNING id, puntaje_total, nivel_riesgo
    `;

    if (risk.level === "ALTO" && user.role === "analista") {
      await sql`
        INSERT INTO alerta (evaluacion_id, tipo, nivel, dirigida_a_rol)
        VALUES (${evaluacion.id}, 'riesgo_alto', 'ALTO', 'oficial_cumplimiento')
      `;
    }

    await writeAuditLog({
      usuarioId: user.id,
      rol: user.role,
      accion: "POST /api/evaluacion",
      recursoTipo: "evaluacion_riesgo",
      recursoId: evaluacion.id,
      resultado: "exito"
    });

    return c.json({
      id: evaluacion.id,
      formularioId,
      puntaje: evaluacion.puntaje_total,
      nivelRiesgo: evaluacion.nivel_riesgo
    });
  }
);

formRoute.get(
  "/formulario/:id",
  requireRoles(["analista", "oficial_cumplimiento", "administrador", "proveedor"]),
  async (c) => {
    const formularioId = Number(c.req.param("id"));
    if (!Number.isInteger(formularioId) || formularioId <= 0) {
      return c.json({ message: "Invalid formulario id" }, 400);
    }

    const [row] = await sql<{
      id: number;
      estado: string;
      paso_actual: number;
      datos_json: object;
      proveedor_id: number;
    }[]>`
      SELECT id, estado, paso_actual, datos_json, proveedor_id
      FROM formulario_evaluacion
      WHERE id = ${formularioId}
      LIMIT 1
    `;

    if (!row) {
      return c.json({ message: "Not found" }, 404);
    }

    const [evaluacion] = await sql<{ puntaje_total: number; nivel_riesgo: string }[]>`
      SELECT puntaje_total, nivel_riesgo
      FROM evaluacion_riesgo
      WHERE formulario_id = ${row.id}
      LIMIT 1
    `;

    return c.json({
      id: row.id,
      estado: row.estado,
      pasoActual: row.paso_actual,
      proveedorId: row.proveedor_id,
      datos: row.datos_json,
      evaluacion: evaluacion
        ? { puntaje: evaluacion.puntaje_total, nivelRiesgo: evaluacion.nivel_riesgo }
        : null
    });
  }
);

formRoute.post(
  "/formulario/:id/aprobacion",
  requireRoles(["analista", "oficial_cumplimiento", "administrador"]),
  async (c) => {
    const user = c.get("user");
    const formularioId = Number(c.req.param("id"));

    if (!Number.isInteger(formularioId) || formularioId <= 0) {
      return c.json({ message: "Invalid formulario id" }, 400);
    }

    const [evaluacion] = await sql<{ id: number; nivel_riesgo: "BAJO" | "MEDIO" | "ALTO" }[]>`
      SELECT id, nivel_riesgo
      FROM evaluacion_riesgo
      WHERE formulario_id = ${formularioId}
      LIMIT 1
    `;

    if (!evaluacion) {
      return c.json({ message: "No risk evaluation found" }, 404);
    }

    if (evaluacion.nivel_riesgo === "ALTO" && user.role === "analista") {
      await sql`
        INSERT INTO alerta (evaluacion_id, tipo, nivel, dirigida_a_rol)
        VALUES (${evaluacion.id}, 'aprobacion_bloqueada', 'ALTO', 'oficial_cumplimiento')
      `;

      await writeAuditLog({
        usuarioId: user.id,
        rol: user.role,
        accion: "POST /api/formulario/:id/aprobacion",
        recursoTipo: "formulario_evaluacion",
        recursoId: formularioId,
        resultado: "fallo"
      });

      return c.json(
        { message: "Forbidden: analista cannot approve high risk providers" },
        403
      );
    }

    const [updated] = await sql<{ id: number; estado: string }[]>`
      UPDATE formulario_evaluacion
      SET estado = 'aprobado', updated_at = NOW()
      WHERE id = ${formularioId}
      RETURNING id, estado
    `;

    if (!updated) {
      return c.json({ message: "Formulario not found" }, 404);
    }

    await writeAuditLog({
      usuarioId: user.id,
      rol: user.role,
      accion: "POST /api/formulario/:id/aprobacion",
      recursoTipo: "formulario_evaluacion",
      recursoId: formularioId,
      resultado: "exito"
    });

    return c.json({
      id: updated.id,
      estado: updated.estado,
      aprobadoPor: user.role
    });
  }
);
