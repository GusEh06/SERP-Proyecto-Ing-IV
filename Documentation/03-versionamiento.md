# Versionamiento del documento y del código — Cierre Proyecto Semestral

---

## Historial de versiones del documento

| Versión | Fecha | Cambio / detalle |
|---|---|---|
| 0.1 | (Sprint 1) | Plantilla inicial de retrospectiva y adecuaciones (borrador). |
| 0.2 | Semana 8 jun | Inserción de métricas ISTQB/TMMi/TQM del Parcial 2 y estado del backlog. |
| 1.0 | 10 jul 2026 | Consolidación final: retrospectiva, adecuaciones, remediation Railway, responsabilidades por rol y anexos. |

---

## Justificación de cada modificación

- **v0.1 → v0.2:** se incorporaron las métricas reales del Parcial 2 (9/9 tests, debt ~4%, CC ≤ 10, cobertura RF 90%) para sustentar las adecuaciones con datos.
- **v0.2 → v1.0:** se añadió la **remediation post-entrega** (cookies cross-site, reintentos de BD, SSL, fail-fast) y las responsabilidades individuales por rol (PO / Gestor de código+Deployment / Programador+Tester), requeridas por la rúbrica de cierre.
- Se mantuvo la estructura de la plantilla original (portada, índice, retrospectivas, adecuaciones, versionamiento, conclusiones, anexos) para facilitar la importación manual al documento de entrega.

---

## Evidencias de control de versiones (Git)

Repositorio: `https://github.com/GusEh06/SERP-Proyecto-Ing-IV`

### Historial de commits relevantes (rama `main`)

| Commit | Fecha | Descripción |
|---|---|---|
| `6fe4707` | 2026-05-31 | Proyecto Base |
| `4e7c362` | 2026-05-31 | Version Deploy on Railway |
| `1fcf74b` | 2026-05-31 | Version Deploy on Railway - Fix 1 |
| `90b5109` | 2026-06-23 | feat: login OWASP, dashboard, audit log y tests de integración |
| `30e1313` | 2026-06-24 | ci: agregar servicio PostgreSQL para tests de integración |
| `9c1d211` | 2026-06-24 | ci: crear database serp en service container PostgreSQL |
| `ecc5e13` | 2026-06-24 | Merge PR #1 (ultima-de-junio) |
| `ba4671e` | 2026-07-10 | fix: align postgres/deployment with railway.md remediation |
| `0e4a83a` | 2026-07-10 | test: cover remediation fixes and fix cookie assertion regression |
| `e9e343d` | 2026-07-10 | Merge PR #3 (fix/railway-deployment-remediation) |
| `b3794d4` | 2026-07-10 | Add allowedHosts configuration to Vite server |
| `2ba3634` | 2026-07-10 | Fix formatting in vite.config.ts |

### Ramas de trabajo
- `main` — línea principal de entrega.
- `ultima-de-junio` — Parcial 2 (login OWASP, dashboard, audit log, integración).
- `fix/railway-deployment-remediation` — correcciones de despliegue y seguridad (mergeada en `main` vía PR #3).

### Comandos de verificación (reproducibilidad)
```bash
git clone https://github.com/GusEh06/SERP-Proyecto-Ing-IV.git
git log --oneline --date=short --pretty=format:"%h %ad %s"
```
