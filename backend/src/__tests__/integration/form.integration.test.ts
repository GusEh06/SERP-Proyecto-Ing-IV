import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { sql } from "../../db/client";
import { runMigrations } from "../../db/migrate";
import { authRoute } from "../../routes/auth.route";
import { formRoute } from "../../routes/form.route";
import bcrypt from "bcrypt";

const app = new Hono();
app.route("/auth", authRoute);
app.route("/api", formRoute);

const TEST_JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-for-integration";

async function createToken(payload: {
  id: number;
  email: string;
  role: string;
  name: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: String(payload.id),
      email: payload.email,
      role: payload.role,
      name: payload.name,
      iat: now,
      exp: now + 3600
    },
    TEST_JWT_SECRET
  );
}

const TRUNCATE_ORDER = [
  "auditoria_log",
  "alerta",
  "verificacion_lista",
  "evaluacion_riesgo",
  "documento_requerido",
  "formulario_evaluacion",
  "proveedor"
];

const VALID_PROVEEDOR = {
  razonSocial: "Test Corp SA",
  ruc: "8-123-456789",
  tipoPersona: "juridica",
  paisOrigen: "Panama",
  representanteLegal: "Juan Perez",
  documentoIdentidad: "8-123-456"
};

function buildPayload(overrides: Record<string, unknown> = {}) {
  return {
    proveedor: { ...VALID_PROVEEDOR, ...overrides },
    datos: {
      economica: {
        actividadPrincipal: "Servicios",
        ciiu: "6201",
        descripcionServicio: "Consultoria",
        beneficiarioFinal: "Maria Lopez"
      },
      listas: { ofac: "no", onu: "no", interpol: "no", panamaCompra: "no" },
      riesgo: {
        esPaisGafi: "no",
        esPep: "no",
        montoRango: "0-5k",
        observaciones: ""
      },
      documentos: {
        certificadoRegistroPublico: true,
        rucDgi: true,
        idRepresentante: true,
        declaracionBeneficiario: true,
        estadosFinancieros: true
      },
      firma: {
        nombreAnalista: "Test Analyst",
        cargoAnalista: "Analista de Riesgo",
        fechaAnalisis: "2026-06-23",
        firmaAceptada: true
      }
    },
    ...overrides
  };
}

beforeAll(async () => {
  await runMigrations();
});

afterEach(async () => {
  for (const table of TRUNCATE_ORDER) {
    await sql.unsafe(`TRUNCATE TABLE ${table} CASCADE`);
  }

  const hashes = await Promise.all([
    bcrypt.hash("proveedor123", 10),
    bcrypt.hash("admin123", 10),
    bcrypt.hash("analista123", 10),
    bcrypt.hash("oficial123", 10)
  ]);

  await sql`
    INSERT INTO usuario (nombre, email, password_hash, rol)
    VALUES
      ('Proveedor Demo', 'proveedor@serp.local', ${hashes[0]}, 'proveedor'),
      ('Admin SERP', 'admin@serp.local', ${hashes[1]}, 'administrador'),
      ('Analista SERP', 'analista@serp.local', ${hashes[2]}, 'analista'),
      ('Oficial Cumplimiento', 'oficial@serp.local', ${hashes[3]}, 'oficial_cumplimiento')
    ON CONFLICT (email) DO NOTHING
  `;

  await sql`
    INSERT INTO lista_restrictiva (nombre, tipo, descripcion)
    VALUES
      ('OFAC', 'sanciones', 'Oficina de Control de Activos Extranjeros'),
      ('ONU', 'sanciones', 'Consejo de Seguridad de Naciones Unidas'),
      ('INTERPOL', 'investigacion', 'Base de personas buscadas y alertas internacionales'),
      ('PANAMACOMPRA_INHABILITADOS', 'inhabilitados', 'Registro de inhabilitados de contrataciones publicas')
    ON CONFLICT (nombre) DO NOTHING
  `;
});

afterAll(async () => {
  await sql.end();
});

describe("POST /api/public/formulario", () => {
  it("crea proveedor, formulario, evaluacion y audit log", async () => {
    const res = await app.request("/api/public/formulario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload())
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.proveedorId).toBeDefined();
    expect(body.evaluacion).toBeDefined();
    expect(body.evaluacion.nivelRiesgo).toBe("BAJO");

    const [proveedor] = await sql`SELECT id FROM proveedor WHERE id = ${body.proveedorId}`;
    expect(proveedor).toBeDefined();

    const [formulario] = await sql`SELECT id, estado FROM formulario_evaluacion WHERE id = ${body.id}`;
    expect(formulario).toBeDefined();
    expect(formulario.estado).toBe("borrador");

    const [evaluacion] = await sql`SELECT nivel_riesgo, puntaje_total FROM evaluacion_riesgo WHERE formulario_id = ${body.id}`;
    expect(evaluacion).toBeDefined();
    expect(evaluacion.nivel_riesgo).toBe("BAJO");
    expect(evaluacion.puntaje_total).toBe(0);

    const [auditLog] = await sql`
      SELECT usuario_id, accion, resultado
      FROM auditoria_log
      WHERE recurso_id = ${body.id}
      ORDER BY timestamp_utc DESC
      LIMIT 1
    `;
    expect(auditLog).toBeDefined();
    expect(auditLog.usuario_id).toBe("0");
    expect(auditLog.accion).toBe("POST /api/public/formulario");
    expect(auditLog.resultado).toBe("exito");
  });

  it("retorna 400 y audit log de fallo con validacion invalida", async () => {
    const res = await app.request("/api/public/formulario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proveedor: {}, datos: {} })
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toBe("Bad request");
    expect(body.issues).toBeDefined();

    const [auditLog] = await sql`
      SELECT usuario_id, resultado FROM auditoria_log ORDER BY timestamp_utc DESC LIMIT 1
    `;
    expect(auditLog).toBeDefined();
    expect(auditLog.usuario_id).toBe("0");
    expect(auditLog.resultado).toBe("fallo");
  });
});

describe("POST /auth/login", () => {
  it("retorna cookie httpOnly con credenciales validas", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "analista@serp.local", password: "analista123" })
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.role).toBe("analista");
    expect(body.token).toBeUndefined();

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("serp_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  });

  it("retorna 401 con credenciales invalidas", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "analista@serp.local", password: "wrong" })
    });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/formulario (auth)", () => {
  it("crea formulario autenticado y registra audit log", async () => {
    const token = await createToken({
      id: 3,
      email: "analista@serp.local",
      role: "analista",
      name: "Analista SERP"
    });

    const res = await app.request("/api/formulario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(buildPayload())
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.estado).toBe("borrador");

    const [auditLog] = await sql`
      SELECT usuario_id, rol, accion, resultado
      FROM auditoria_log
      WHERE recurso_id = ${body.id} AND accion = 'POST /api/formulario'
      ORDER BY timestamp_utc DESC
      LIMIT 1
    `;
    expect(auditLog).toBeDefined();
    expect(auditLog.usuario_id).toBe("3");
    expect(auditLog.rol).toBe("analista");
    expect(auditLog.resultado).toBe("exito");
  });

  it("retorna 401 sin token", async () => {
    const res = await app.request("/api/formulario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload())
    });

    expect(res.status).toBe(401);
  });
});

describe("PUT /api/formulario/:id", () => {
  it("actualiza formulario y registra audit log", async () => {
    const token = await createToken({
      id: 3,
      email: "analista@serp.local",
      role: "analista",
      name: "Analista SERP"
    });

    const createRes = await app.request("/api/formulario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(buildPayload())
    });
    const created = await createRes.json();

    const res = await app.request(`/api/formulario/${created.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        estado: "en_revision",
        pasoActual: 3,
        datos: buildPayload().datos
      })
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.estado).toBe("en_revision");
    expect(body.pasoActual).toBe(3);

    const [auditLog] = await sql`
      SELECT accion, resultado FROM auditoria_log
      WHERE recurso_id = ${created.id} AND accion = 'PUT /api/formulario/:id'
      ORDER BY timestamp_utc DESC LIMIT 1
    `;
    expect(auditLog).toBeDefined();
    expect(auditLog.resultado).toBe("exito");
  });
});

describe("POST /api/evaluacion", () => {
  it("calcula scoring y persiste evaluacion_riesgo", async () => {
    const token = await createToken({
      id: 3,
      email: "analista@serp.local",
      role: "analista",
      name: "Analista SERP"
    });

    const createRes = await app.request("/api/formulario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(buildPayload())
    });
    const created = await createRes.json();

    const res = await app.request("/api/evaluacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        formularioId: Number(created.id),
        esPep: true,
        esPaisGafi: true,
        montoAnualUsd: 60000,
        coincidenciaLista: true
      })
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.nivelRiesgo).toBe("ALTO");
    expect(body.puntaje).toBeGreaterThanOrEqual(75);

    const [evaluacion] = await sql`
      SELECT nivel_riesgo, es_pep, es_pais_gafi
      FROM evaluacion_riesgo
      WHERE formulario_id = ${created.id}
    `;
    expect(evaluacion).toBeDefined();
    expect(evaluacion.nivel_riesgo).toBe("ALTO");
    expect(evaluacion.es_pep).toBe(true);
    expect(evaluacion.es_pais_gafi).toBe(true);
  });
});

describe("POST /api/formulario/:id/aprobacion", () => {
  it("oficial aprueba formulario de riesgo BAJO", async () => {
    const token = await createToken({
      id: 4,
      email: "oficial@serp.local",
      role: "oficial_cumplimiento",
      name: "Oficial Cumplimiento"
    });

    const createRes = await app.request("/api/formulario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(buildPayload())
    });
    const created = await createRes.json();

    await app.request("/api/evaluacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        formularioId: Number(created.id),
        esPep: false,
        esPaisGafi: false,
        montoAnualUsd: 1000,
        coincidenciaLista: false
      })
    });

    const res = await app.request(`/api/formulario/${created.id}/aprobacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.estado).toBe("aprobado");
    expect(body.aprobadoPor).toBe("oficial_cumplimiento");

    const [auditLog] = await sql`
      SELECT accion, resultado FROM auditoria_log
      WHERE recurso_id = ${created.id} AND accion = 'POST /api/formulario/:id/aprobacion'
      ORDER BY timestamp_utc DESC LIMIT 1
    `;
    expect(auditLog).toBeDefined();
    expect(auditLog.resultado).toBe("exito");
  });

  it("analista no puede aprobar riesgo ALTO, retorna 403", async () => {
    const analistaToken = await createToken({
      id: 3,
      email: "analista@serp.local",
      role: "analista",
      name: "Analista SERP"
    });

    const createRes = await app.request("/api/formulario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${analistaToken}`
      },
      body: JSON.stringify(buildPayload())
    });
    const created = await createRes.json();

    await app.request("/api/evaluacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${analistaToken}`
      },
      body: JSON.stringify({
        formularioId: Number(created.id),
        esPep: true,
        esPaisGafi: true,
        montoAnualUsd: 60000,
        coincidenciaLista: true
      })
    });

    const res = await app.request(`/api/formulario/${created.id}/aprobacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${analistaToken}`
      }
    });

    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.message).toContain("Forbidden");

    const [alerta] = await sql`
      SELECT tipo, nivel, dirigida_a_rol
      FROM alerta
      WHERE evaluacion_id = (
        SELECT id FROM evaluacion_riesgo WHERE formulario_id = ${created.id}
      ) AND tipo = 'aprobacion_bloqueada'
    `;
    expect(alerta).toBeDefined();
    expect(alerta.tipo).toBe("aprobacion_bloqueada");
    expect(alerta.dirigida_a_rol).toBe("oficial_cumplimiento");

    const [auditLog] = await sql`
      SELECT resultado FROM auditoria_log
      WHERE recurso_id = ${created.id} AND accion = 'POST /api/formulario/:id/aprobacion'
      ORDER BY timestamp_utc DESC LIMIT 1
    `;
    expect(auditLog).toBeDefined();
    expect(auditLog.resultado).toBe("fallo");
  });
});
