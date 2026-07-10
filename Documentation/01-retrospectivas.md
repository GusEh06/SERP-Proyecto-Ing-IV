# Retrospectivas — Cierre Proyecto Semestral (Ingeniería de Software IV)

> **Proyecto:** Sistema SERP — Sistema de Evaluación de Riesgo de Proveedores (Debida Diligencia AML/FT)
> **Marco legal:** Ley 23/2015, Ley 22/2006, GAFI 2023
> **Fuente de información:** `daily_scrum_semana1_SERP.pdf`, `SERP_Entrega_Semanal.pdf`, `TAREAS.txt`, `Fixes-1.md`, `railway.md`, historial Git.

---

## Problemas enfrentados

### 1. Horarios distintos de trabajo
Todos los miembros tienen responsabilidades ajenas al proyecto (trabajo/estudio). La comunicación no siempre estuvo disponible de forma sincrónica por causas de lugar o situación de cada miembro. Esto dificultó las reuniones presenciales y la resolución en tiempo real de bloqueos.

### 2. Problemas de accesos
No todos los miembros tenían acceso a todos los entornos de código, prueba y despliegue (Railway, repositorio, credenciales de servicios externos). Esto causó atraso en la implementación y el despliegue cuando el miembro con los accesos no estaba disponible. En el Parcial 2 se evidenció además un despliegue fallido por **variables de entorno de Railway mal referenciadas**.

### 3. Seguridad y validación del formulario (bloqueo técnico inicial)
En Sprint 1 el riesgo principal fue definir la secuencia lógica del formulario y aplicar validaciones seguras en cada input. Sin sanitización, el sistema quedaba expuesto a inyección SQL, XSS y phishing al conectar el backend. Se registraron: 5 usos de `innerHTML` sin sanitizar, 18 inputs sin validación de patrón, y `validate()` con **CC = 27** (umbral crítico > 25).

### 4. Deuda técnica y cobertura inicial baja
Sprint 1 cerró con densidad de defectos de **17,2 / KLOC** (umbral industria < 10), debt ratio estimado **~18%** y cobertura de requisitos funcionales del **60%** (backend pendiente).

### 5. Defectos de despliegue (post-Parcial 2)
Tras el despliegue en Railway se detectaron: cookies de autenticación no enviadas entre dominios (SameSite=Strict en subdominios cross-site), crash-loop por falta de reintentos de conexión a BD al arranque, y configuración insegura silenciosa de `JWT_SECRET`/`CORS_ORIGIN` por defecto en producción.

---

## Lecciones aprendidas

- Acordar **fechas y canales de comunicación** donde todos pueden reunirse (presencial o virtual), aunque sea en ventanas cortas.
- Asegurar que **todos los miembros tengan acceso** a las herramientas y plataformas (repo, Railway, servicios externos) desde el inicio.
- Aplicar **medición continua** (ISTQB/TMMi/TQM) desde Sprint 1 permite tomar decisiones basadas en datos y no en intuición.
- La **seguridad no es opcional ni postergable**: validación de inputs, cookies httpOnly/Secure y hashing deben diseñarse desde el inicio.
- Los entornos de producción (Railway) difieren del local; la configuración debe ser **explícita y fallar rápido** ante valores inseguros.

---

## Ajustes que hemos hecho (proceso)

- Se adoptó una **hora fija diaria (10 pm)** para mantener abiertos los canales de comunicación (mensajería y reuniones cortas) y avanzar de forma asíncrona.
- Se gestionó **miembro a miembro** la asignación de los accesos faltantes (repo, Railway, servicios).
- **Apoyo cruzado entre roles**: por horarios irregulares, cada integrante apoyó en tareas de los demás para no bloquear el avance (p. ej. quien tenía acceso al despliegue avanzaba CI/Railway mientras otro cubría pruebas o frontend).
- Se instituyó el **control de calidad automatizado en CI** (lint, typecheck, tests, docker compose) como compuerta obligatoria antes de merge.

---

## Responsabilidades individuales

### Adrián Wong — Programador y Tester
- Desarrollo del **frontend**: formulario/wizard de 6 pasos (`frontend/src/components/wizard/Step1.tsx … Step6.tsx`), `Login.tsx`, `Dashboard.tsx`.
- Validaciones por sección (`frontend/src/validation/validateStep1.ts … validateStep6.ts`); **refactor de `validateStep1` reduciendo CC de ~10 a ≤ 6** mediante helper `requireFields()`.
- Motor de scoring (`backend/src/services/scoring.service.ts`) y pruebas unitarias (3 de scoring + 6 de validación).
- **Pruebas de integración** BD (`backend/src/__tests__/integration/form.integration.test.ts`, 13 tests: CRUD, scoring, RBAC, audit log, login) y reporte de cobertura.
- Documentación de métricas (ISTQB/TMMi/TQM) y consolidación del reporte de entrega.

### Omar Jaramillo — Product Owner
- Levantamiento de **10 RF + 10 RNF** y **21 criterios de aceptación** con base legal (Ley 23/2015, Ley 22/2006, GAFI 2023).
- **Matriz de trazabilidad RF → base legal → código → prueba** (100% de campos vinculados a artículo legal).
- Backlog y tablero Kanban (HU-01…HU-14), priorización **P1/P2/P3** y definición de "Done".
- Validación de que el producto cumple los requisitos regulados y criterios de aceptación.

### Gustavo Sánchez — Gestor de Código y Deployment
- **Arquitectura backend** (Hono + Bun + TypeScript): rutas `auth.route.ts`, `form.route.ts`, `dashboard.route.ts`; middleware `auth` y `rbac` (`requireRoles`).
- **RBAC** con 3 roles (Analista, Oficial de Cumplimiento, Administrador) y bloqueo 403 en riesgo ALTO.
- **CI/CD** GitHub Actions (`.github/workflows/ci.yml`) con servicio PostgreSQL 16 para pruebas de integración.
- **Despliegue en Railway** (3 servicios: `serp-db`, `serp-backend`, `serp-frontend`) y **plan de remediation** (`Fixes-1.md`, `railway.md`): cookies cross-site, reintentos de migración, SSL explícito, fail-fast de configuración insegura.

---

## Responsabilidades colectivas

- **Definición conjunta** del alcance, marco legal y arquitectura del sistema SERP.
- **Revisión cruzada de código** (pull requests) y validación de calidad en CI antes de cada merge.
- **Retrospectivas Scrum** semanales (Daily Scrum, ¿qué hicimos/haRemos/bloqueos?) y ajuste del proceso.
- **Cobertura de pruebas y métricas** compartidas: de 0 a **19 tests passing** (13 backend + 6 frontend), CI verde en `main`.
- **Despliegue y operación** del entorno productivo en Railway, incluyendo la remediation de seguridad post-entrega.
