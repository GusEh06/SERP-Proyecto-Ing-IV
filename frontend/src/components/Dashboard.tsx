import { useEffect, useState } from "react";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";

interface ResumenData {
  total: number;
  porEstado: Record<string, number>;
  porRiesgo: Record<string, number>;
}

interface UsuarioData {
  nombre: string;
  email: string;
  total: number;
  borrador: number;
  en_revision: number;
  aprobado: number;
  rechazado: number;
}

const RIESGO_LABELS: Record<string, string> = {
  BAJO: "Bajo",
  MEDIO: "Medio",
  ALTO: "Alto"
};

const RIESGO_COLORS: Record<string, string> = {
  BAJO: "var(--ok)",
  MEDIO: "var(--warn)",
  ALTO: "var(--error)"
};

export function Dashboard() {
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/dashboard/resumen`, { credentials: "include" }),
      fetch(`${API_BASE}/api/dashboard/por-usuario`, { credentials: "include" })
    ])
      .then(async ([resumenRes, usuariosRes]) => {
        if (!resumenRes.ok || !usuariosRes.ok) {
          throw new Error("Error al cargar datos del dashboard");
        }
        const resumenData = await resumenRes.json() as ResumenData;
        const usuariosData = await usuariosRes.json() as { usuarios: UsuarioData[] };
        setResumen(resumenData);
        setUsuarios(usuariosData.usuarios);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error desconocido");
      });
  }, []);

  if (error) {
    return (
      <section className="wizard-shell">
        <div className="error-box">{error}</div>
      </section>
    );
  }

  if (!resumen) {
    return (
      <section className="wizard-shell">
        <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>Cargando...</p>
      </section>
    );
  }

  return (
    <section className="wizard-shell">
      <h2 style={{ margin: "0 0 1rem", color: "var(--primary-strong)" }}>Resumen</h2>

      <div className="summary-wrap">
        <div className="summary-card">
          <strong>{resumen.total}</strong>
          <span>Total formularios</span>
        </div>
        <div className="summary-card">
          <strong>{resumen.porEstado.aprobado ?? 0}</strong>
          <span>Aprobados</span>
        </div>
        <div className="summary-card">
          <strong>{resumen.porEstado.en_revision ?? 0}</strong>
          <span>En revision</span>
        </div>
      </div>

      <h3 style={{ margin: "1.5rem 0 0.75rem", color: "var(--primary-strong)" }}>Por nivel de riesgo</h3>

      <div className="summary-wrap">
        {Object.entries(RIESGO_LABELS).map(([key, label]) => (
          <div className="summary-card" key={key}>
            <strong style={{ color: RIESGO_COLORS[key] }}>
              {resumen.porRiesgo[key] ?? 0}
            </strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <h3 style={{ margin: "1.5rem 0 0.75rem", color: "var(--primary-strong)" }}>Por usuario</h3>

      {usuarios.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No hay datos de usuarios aun.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "0.6rem 0.5rem", color: "var(--muted)" }}>Usuario</th>
                <th style={{ textAlign: "center", padding: "0.6rem 0.5rem", color: "var(--muted)" }}>Total</th>
                <th style={{ textAlign: "center", padding: "0.6rem 0.5rem", color: "var(--muted)" }}>Borrador</th>
                <th style={{ textAlign: "center", padding: "0.6rem 0.5rem", color: "var(--muted)" }}>En revision</th>
                <th style={{ textAlign: "center", padding: "0.6rem 0.5rem", color: "var(--muted)" }}>Aprobado</th>
                <th style={{ textAlign: "center", padding: "0.6rem 0.5rem", color: "var(--muted)" }}>Rechazado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.email} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "0.5rem" }}>
                    <div>{u.nombre}</div>
                    <small style={{ color: "var(--muted)" }}>{u.email}</small>
                  </td>
                  <td style={{ textAlign: "center", padding: "0.5rem", fontWeight: 700 }}>{u.total}</td>
                  <td style={{ textAlign: "center", padding: "0.5rem" }}>{u.borrador}</td>
                  <td style={{ textAlign: "center", padding: "0.5rem" }}>{u.en_revision}</td>
                  <td style={{ textAlign: "center", padding: "0.5rem", color: "var(--ok)" }}>{u.aprobado}</td>
                  <td style={{ textAlign: "center", padding: "0.5rem", color: "var(--error)" }}>{u.rechazado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
