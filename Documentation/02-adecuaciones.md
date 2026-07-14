# Adecuaciones del Parcial 2 — Cierre Proyecto Semestral

> Comparativo de estado: **Sprint 1** (`daily_scrum_semana1_SERP.pdf`) → **Parcial 2 / Semana 8** (`SERP_Entrega_Semanal.pdf`) → **Remediation post-entrega** (`TAREAS.txt`, `Fixes-1.md`, `railway.md`, git log jul-2026).

---

## Funcionalidades ajustadas

- **Audit Log en endpoint público `/public/formulario`** (brecha RF-09 detectada en Parcial 2): se agregó `writeAuditLog` con `usuarioId=0` (sistema) e `ipAddress`, registrando éxito (201), fallo de validación (400) y error de servidor (500). Columna `ip_address VARCHAR(45)` en `auditoria_log`; captura de IP desde `x-forwarded-for` / `x-real-ip`.
- **Refactor de `validateStep1`** (complejidad ciclomática): de **CC ≈ 10** (límite) a **CC ≤ 6** extrayendo el helper `requireFields()`, manteniendo 6 tests en verde.
- **Transacción en `createFormularioRecord`**: los 2 INSERTs que estaban sin transacción (riesgo de inconsistencia identificado en Parcial 2) se resolvieron como parte de la remediation de datos.
- **Login hardening (OWASP)**: reescritura de `auth.route.ts`/`Login.tsx` con `bcrypt`, cookies `httpOnly` (no `localStorage`), rate limiting (5 intentos / 5 min) y audit log de login.
- **Dashboard de métricas (HU-08)**: `GET /api/dashboard/resumen` y `/por-usuario`, con nav bar y roles.

---

## Mejoras implementadas

- **HU-08 Dashboard de métricas**: resumen (totales, distribución de riesgo, tasa de aprobación) y métricas por usuario.
- **Login OWASP**: hashing `bcrypt`, cookies `httpOnly` + `Secure`, rate limiting, middleware `auth` que lee Bearer **o** cookie, CORS con `credentials: true`.
- **Pruebas de integración con BD real**: 13 tests (CRUD, scoring, RBAC, audit log, login) sobre PostgreSQL en CI; 3 tests unitarios de scoring; 6 de validación frontend → **19 tests passing**.
- **Pipeline CI robusto**: servicio PostgreSQL 16-alpine, health checks, `DATABASE_URL`/`JWT_SECRET`; 16 checks (lint, typecheck, tests, docker compose).
- **Remediation de despliegue Railway** (`Fixes-1.md`): cookies cross-site (`SameSite=None`+`Secure`), reintentos de migración con backoff, SSL explícito, fail-fast ante defaults inseguros, advisory lock para réplicas.

---

## Métricas aplicadas (ISTQB · TMMi · TQM)

### Cuadro comparativo de evolución

| Métrica | Marco | Sprint 1 | Parcial 2 (Sem 8) | Remediation (jul) |
|---|---|---|---|---|
| Densidad de defectos | ISTQB | 17,2 / KLOC | 1,32 / KLOC | mantenido < 10 |
| Debt Ratio | ISTQB/TQM | ~18% (manual) | ~4% | < 5% |
| Complejidad Ciclomática (máx) | ISTQB | 27 (`validate()`) | ≤ 10 (`validateStep1`=10) | ≤ 6 (`validateStep1`) |
| Cobertura RF | ISTQB | 60% (6/10) | 90% (9/10) | 100% (10/10) |
| Trazabilidad RF→Ley | ISTQB | 100% | 100% | 100% |
| Pruebas (tests passing) | TMMi | 0 | 9/9 | **19/19** |
| Cobertura de ramas `calculateRisk()` | ISTQB | n/a | 75% | 75% |
| KLOC producción | ISTQB | 0,407 (JS) | 1,52 | ~1,6 |
| CI | TMMi | — | Verde (`main`) | Verde (16 checks) |
| Madurez de pruebas | TMMi | — | **Nivel 2 (Managed)** | Nivel 2 + integración |
| Volatilidad de requisitos | ISTQB | 35% (7/20) | 0% | 0% |

### Interpretación
- **ISTQB:** la densidad de defectos bajó de 17,2 a 1,32 / KLOC (por debajo del umbral industrial < 10); la complejidad ciclomática se llevó bajo el límite (≤ 10 → ≤ 6), mejorando la testabilidad; la cobertura RF pasó de 60% a 100%.
- **TMMi:** se alcanzó **Nivel 2 (Managed)** con política de pruebas, planificación, monitoreo y ejecución; se añadió integración continua con BD real y 19 tests automatizados.
- **TQM (mejora continua):** enfoque en el cliente (Ley 23/2015 y GAFI), decisiones basadas en datos (scoring 0–130 pts), gestión de procesos (wizard→scoring→aprobación medido extremo a extremo) y participación de personas (roles diferenciados). El ciclo correctivo "Fix 1 → detectado y resuelto en producción" evidenció mejora continua.

---

## Defectos corregidos

| ID | Defecto | Estado | Referencia |
|---|---|---|---|
| D-01 | 2 INSERTs sin transacción en `createFormularioRecord` (inconsistencia) | Corregido | `Fixes-1.md` / schema |
| D-02 | Endpoint público sin audit log (brecha RF-09) | Corregido | `/public/formulario`, `audit.service.ts` |
| D-03 | Cookies `SameSite=Strict` no enviadas cross-site en Railway | Corregido | `auth.route.ts`, `config.ts` |
| D-04 | Crash-loop por BD no disponible al arranque | Corregido | `db/migrate.ts` (retry+backoff) |
| D-05 | SSL implícito en `postgres()` | Corregido | `client.ts` + `DATABASE_SSL` |
| D-06 | Defaults inseguros `JWT_SECRET`/`CORS_ORIGIN="*"` en prod | Corregido | `config.ts` fail-fast |
| D-07 | `validateStep1` CC ≈ 10 (límite) | Corregido | `validateStep1.ts` (CC ≤ 6) |

---

## Justificación de decisiones técnicas

- **Backend Hono + Bun + TypeScript:** ligero y rápido para API REST con tipado fuerte; despliegue sencillo en contenedores Railway.
- **Despliegue en Railway como 3 servicios** (`serp-db`, `serp-backend`, `serp-frontend`): separación de responsabilidades y escalado independiente; la BD gestionada por Railway reduce operación.
- **Cookies `SameSite=None` + `Secure` en producción:** los subdominios `*.up.railway.app` son cross-site (sufijo público), por lo que las cookies deben ser cross-site y seguras para mantener la sesión; en local se conserva `Lax`/`Strict`.
- **`bcrypt` + cookies `httpOnly` + rate limiting:** mitiga A07 (Auth Failures) y reduce superficie de robo de token frente a `localStorage`.
- **Reintentos de migración con backoff y advisory lock:** evita crash-loop en el arranque de Railway (IPv6/internal) y protege DDL si escala a >1 réplica.
- **Fail-fast de configuración:** lanza error en producción si `JWT_SECRET` es el default o `CORS_ORIGIN` es `"*"`, evitando exposición silenciosa.
- **Pruebas de integración con PostgreSQL en CI:** validan el comportamiento real (RBAC, audit, login) y no solo unidades aisladas.
