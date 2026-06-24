import { sql } from "../db/client";

export async function writeAuditLog(input: {
  usuarioId: number;
  rol: string;
  accion: string;
  recursoTipo: string;
  recursoId?: number;
  resultado: "exito" | "fallo";
  ipAddress?: string;
}) {
  await sql`
    INSERT INTO auditoria_log (usuario_id, rol, accion, recurso_tipo, recurso_id, resultado, ip_address)
    VALUES (
      ${input.usuarioId},
      ${input.rol},
      ${input.accion},
      ${input.recursoTipo},
      ${input.recursoId ?? null},
      ${input.resultado},
      ${input.ipAddress ?? null}
    )
  `;
}
