# Conclusiones — Cierre Proyecto Semestral (Ingeniería de Software IV)

---

## Aprendizaje técnico (reflexión individual)

> **Nota:** las reflexiones personales deben ser redactadas por cada integrante. Se dejan los espacios para completar.

### Adrián Wong (Programador y Tester)
_Completar reflexión sobre aprendizaje técnico: frontend (React/Vite/TypeScript), validaciones y reducción de complejidad ciclomática, motor de scoring, pruebas unitarias e integración, y reporte de métricas ISTQB/TMMi/TQM._

### Omar Jaramillo (Product Owner)
_Completar reflexión sobre aprendizaje técnico: ingeniería de requisitos, trazabilidad RF→Ley 23/2015/GAFI, gestión de backlog/Kanban, criterios de aceptación y validación de cumplimiento normativo._

### Gustavo Sánchez (Gestor de Código y Deployment)
_Completar reflexión sobre aprendizaje técnico: arquitectura backend (Hono/Bun), RBAC, CI/CD con GitHub Actions, despliegue en Railway, seguridad (OWASP) y remediation de producción._

---

## Calidad del producto (conclusión grupal)

El sistema SERP entrega un flujo completo de debida diligencia de proveedores: formulario/wizard de 6 pasos → scoring automático (0–130 pts, niveles BAJO/MEDIO/ALTO) → aprobación con RBAC y auditoría. Se alcanzó:

- **Cobertura RF 100%** (10/10) y **trazabilidad 100%** a la base legal.
- **19/19 tests passing** (13 integración + 6 frontend) y **CI verde** (16 checks).
- **Densidad de defectos 1,32 / KLOC** (< 10) y **debt ratio ~4%**.
- **Complejidad ciclomática ≤ 6** en las funciones críticas tras refactor.
- **Madurez TMMi Nivel 2** y cobertura de controles **OWASP Top 10** (A01, A02, A03, A05, A07).
- **Despliegue productivo en Railway** con remediation de seguridad aplicada.

El producto es funcional, medible y alineado a la regulación AML/FT.

---

## Evaluación del proceso colaborativo de trabajo

El equipo trabajó bajo **horarios irregulares y responsabilidades externas**, por lo que adoptó un modelo de **apoyo cruzado**: cada integrante cubrió tareas de los demás para evitar bloqueos. La fijación de un **canal de comunicación a las 10 pm** y la resolución progresiva de **accesos** (repo, Railway, servicios) fueron clave para sostener el avance. La retrospectiva Scrum semanal y el tablero Kanban permitieron visibilidad y priorización (P1/P2/P3).

---

## Recomendaciones de mejora para futuras iteraciones

1. **Accesos desde el día 1:** provisionar cuentas y permisos de todos los entornos antes de iniciar el sprint.
2. **Comunicación sincrónica mínima garantizada:** bloquear al menos una ventana corta semanal obligatoria.
3. **SonarQube en CI:** automatizar debt ratio y vulnerabilidades (pendiente desde Sprint 1).
4. **Pruebas E2E** del flujo completo login → wizard → envío.
5. **Refresh tokens / timeout de sesión:** actualmente solo access token (8 h) sin logout automático por timeout.
6. **Dashboard con datos reales** (hoy muestra mock de scoring) y retención 5 años (RF-10) vía Railway Volume.
7. **Transacciones explícitas** en todas las escrituras y cobertura de ramas al 100% en `calculateRisk()`.
