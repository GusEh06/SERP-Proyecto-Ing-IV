# Anexos — Evidencias del Software (Cierre Proyecto Semestral)

---

## A. Capturas del sistema (placeholders)

> Insertar en el documento de entrega las siguientes capturas:

1. **Formulario/wizard de 6 pasos** (`frontend/src/components/wizard/Step1.tsx … Step6.tsx`).
2. **Login** (`frontend/src/components/Login.tsx`) y sesión con roles.
3. **Dashboard de métricas** (`frontend/src/components/Dashboard.tsx`) — `GET /api/dashboard/resumen`.
4. **GitHub Actions — pipeline verde** (`.github/workflows/ci.yml`, 16 checks).
5. **Railway — deploy exitoso** (servicios `serp-db`, `serp-backend`, `serp-frontend`).
6. **SonarQube Security Review** (pendiente de configurar; usar reporte manual de debt ratio).

---

## B. Código relevante

| Módulo | Archivo | Contenido |
|---|---|---|
| Scoring | `backend/src/services/scoring.service.ts` | `calculateRisk()` — niveles BAJO/MEDIO/ALTO, Ley 23/GAFI |
| Validación | `frontend/src/validation/validateStep1.ts` | `requireFields()` — CC reducido a ≤ 6 |
| RBAC | `backend/src/middleware/rbac.ts` | `requireRoles()` — bloqueo 403 en riesgo ALTO |
| Auth | `backend/src/routes/auth.route.ts` | bcrypt, cookie httpOnly/Secure, rate limiting |
| Audit | `backend/src/services/audit.service.ts` | `writeAuditLog` (sistema + IP) |
| Form | `backend/src/routes/form.route.ts` | `/public/formulario` + audit log |
| Dashboard | `backend/src/routes/dashboard.route.ts` | resumen y por-usuario |
| Deploy | `railway.md`, `Fixes-1.md` | guía y remediation de seguridad |
| CI | `.github/workflows/ci.yml` | PostgreSQL 16, lint, typecheck, tests, docker |

---

## C. Reportes de pruebas

- **Pruebas unitarias:** 3 de `scoring.service` + 6 de validación frontend = **9/9 passing** (Parcial 2).
- **Pruebas de integración (post-Parcial 2):** **13 tests** en `backend/src/__tests__/integration/form.integration.test.ts` (CRUD, scoring, RBAC, audit log, login: cookie httpOnly, credenciales inválidas, rate limiting) + 6 frontend = **19/19 passing**.
- **Cobertura por módulo:** `calculateRisk()` 3/3, `validateStep1..6` 6/6.
- **Reproducir:**
  ```bash
  cd backend && bun run test      # unit + integration (requiere PostgreSQL)
  cd frontend && bun run test     # 6 validation tests
  ```

---

## D. Métricas aplicadas (ISTQB – TMMi – TQM)

Ver cuadro comparativo en `02-adecuaciones.md` → "Métricas aplicadas". Resumen:

- **ISTQB:** defectos 17,2 → 1,32 / KLOC; debt 18% → 4%; CC 27 → ≤ 6; cobertura RF 60% → 100%; trazabilidad 100%.
- **TMMi:** Nivel 2 (Managed); 19 tests automatizados; CI verde.
- **TQM:** enfoque en cliente (Ley 23/GAFI), decisiones por datos (scoring 0–130), mejora continua (ciclo correctivo en producción).

---

## E. Tablero actualizado (Kanban / Backlog)

- **Sprint 1→2 (Daily Scrum):** TO DO (HU-08,09,10,11), IN PROGRESS (HU-01,06,12), DONE (HU-02,03,04,05,07), BLOQUEADO (HU-13,14).
- **Sprint 2 (Entrega Semanal):** Completadas HU-01…HU-06; En progreso HU-07, SonarQube, HU-09, CA-04/06, audit endpoint, transacción BD.
- **Velocidad Sprint 1:** 21 pts completados · 23 en progreso · 24 pendientes · 21 bloqueados.
- **Captura sugerida:** GitHub Issues / tablero del proyecto.

---

## F. Enlace de versionamiento del repositorio

- **Repositorio:** https://github.com/GusEh06/SERP-Proyecto-Ing-IV
- **PRs:** #1 (ultima-de-junio), #3 (fix/railway-deployment-remediation)
- **Ramas:** `main`, `ultima-de-junio`, `fix/railway-deployment-remediation`
