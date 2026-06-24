import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { sql } from "../db/client";

export const dashboardRoute = new Hono();

dashboardRoute.use("*", authMiddleware);

dashboardRoute.get(
  "/dashboard/resumen",
  requireRoles(["analista", "oficial_cumplimiento", "administrador"]),
  async (c) => {
    const [totalRow] = await sql<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM formulario_evaluacion
    `;

    const porEstado = await sql<{ estado: string; cantidad: number }[]>`
      SELECT estado, COUNT(*)::int AS cantidad
      FROM formulario_evaluacion
      GROUP BY estado
      ORDER BY estado
    `;

    const porRiesgo = await sql<{ nivel_riesgo: string; cantidad: number }[]>`
      SELECT nivel_riesgo, COUNT(*)::int AS cantidad
      FROM evaluacion_riesgo
      GROUP BY nivel_riesgo
      ORDER BY nivel_riesgo
    `;

    return c.json({
      total: totalRow.total,
      porEstado: Object.fromEntries(porEstado.map((r) => [r.estado, r.cantidad])),
      porRiesgo: Object.fromEntries(porRiesgo.map((r) => [r.nivel_riesgo, r.cantidad]))
    });
  }
);

dashboardRoute.get(
  "/dashboard/por-usuario",
  requireRoles(["analista", "oficial_cumplimiento", "administrador"]),
  async (c) => {
    const rows = await sql<{
      nombre: string;
      email: string;
      total: number;
      borrador: number;
      en_revision: number;
      aprobado: number;
      rechazado: number;
    }[]>`
      SELECT
        u.nombre,
        u.email,
        COUNT(fe.id)::int AS total,
        COUNT(fe.id) FILTER (WHERE fe.estado = 'borrador')::int AS borrador,
        COUNT(fe.id) FILTER (WHERE fe.estado = 'en_revision')::int AS en_revision,
        COUNT(fe.id) FILTER (WHERE fe.estado = 'aprobado')::int AS aprobado,
        COUNT(fe.id) FILTER (WHERE fe.estado = 'rechazado')::int AS rechazado
      FROM usuario u
      LEFT JOIN formulario_evaluacion fe ON fe.id IN (
        SELECT al.recurso_id
        FROM auditoria_log al
        WHERE al.usuario_id = u.id
          AND al.accion = 'POST /api/formulario'
          AND al.resultado = 'exito'
          AND al.recurso_id IS NOT NULL
      )
      WHERE u.rol IN ('analista', 'oficial_cumplimiento', 'administrador')
        AND u.id != 0
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total DESC
    `;

    return c.json({ usuarios: rows });
  }
);
