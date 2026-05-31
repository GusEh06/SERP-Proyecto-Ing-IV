# PRD — Sistema SERP
## Sistema de Evaluación de Riesgo de Proveedores (AML/CFT)

**Versión:** 1.0  
**Fecha:** 2025  
**Clasificación:** Interno — Proyecto Académico / Desarrollo  

---

## 1. Propósito del Documento

Este Product Requirements Document (PRD) define el alcance, los requisitos funcionales y no funcionales, la arquitectura técnica, las restricciones legales y los criterios de aceptación del Sistema SERP. El documento es la fuente de verdad para el desarrollo, y no debe contener instrucciones condicionales ni preguntas abiertas.

---

## 2. Contexto y Problema

Las organizaciones sujetas a regulación AML/CFT en Panamá están legalmente obligadas a realizar debida diligencia sobre sus proveedores antes de entablar cualquier relación contractual. Este proceso actualmente se realiza de forma manual, sin trazabilidad inmutable, sin motor de scoring automatizado y sin integración con listas restrictivas internacionales.

El Sistema SERP resuelve este problema mediante una plataforma web que digitaliza y automatiza el flujo completo: recolección de datos del proveedor → verificación contra listas restrictivas → cálculo de nivel de riesgo → aprobación por rol → custodia de documentos auditables.

---

## 3. Marco Legal Aplicable

El sistema debe cumplir con los siguientes instrumentos legales panameños y estándares internacionales:

| Instrumento | Relevancia |
|---|---|
| Ley 23 de 2015 (Panamá) | Prevención de blanqueo de capitales, financiamiento del terrorismo y proliferación de armas. Arts. 17, 18, 21, 22, 24, 35. |
| Ley 22 de 2006 (Panamá) | Contrataciones públicas. Arts. 22, 36, 47. Prohíbe contratar proveedores inhabilitados por el Estado. |
| Recomendaciones GAFI 10 y 19 | Debida diligencia del cliente (DDC) y DDC reforzada para países de alto riesgo. |
| Estándar FATF/GAFI — EBR | Enfoque Basado en Riesgo para la graduación del nivel de diligencia requerida. |

---

## 4. Objetivos del Producto

**OBJ-01.** Digitalizar el formulario de debida diligencia de proveedores en un wizard de 6 secciones conforme a la Ley 23/2015 y la Ley 22/2006.

**OBJ-02.** Implementar un motor de scoring de riesgo automatizado en el backend que calcule el nivel de riesgo (Bajo / Medio / Alto) en función de variables legalmente definidas.

**OBJ-03.** Restringir las acciones de aprobación de proveedores mediante un sistema de roles (RBAC) que impida al Analista aprobar perfiles de riesgo Alto.

**OBJ-04.** Garantizar la custodia inmutable de documentos y logs de auditoría durante al menos 5 años (Art. 35, Ley 23/2015).

**OBJ-05.** Desplegar el sistema en un entorno contenerizado reproducible con un pipeline CI/CD funcional.

---

## 5. Alcance

### 5.1 En Alcance

- Formulario de evaluación digital (wizard de 6 pasos) con validación por sección.
- Motor de scoring de riesgo ejecutado en el backend.
- Sistema de autenticación y autorización basado en roles (JWT + RBAC).
- Persistencia de datos en PostgreSQL con modelo relacional normalizado.
- Carga y almacenamiento de documentos requeridos.
- Generación de log de auditoría inmutable por evento.
- Pipeline CI/CD con GitHub Actions + despliegue automático en Railway.

### 5.2 Fuera de Alcance (v1.0)

- Integración en tiempo real con APIs externas de listas restrictivas (OFAC, ONU, Interpol). La verificación se registra como declaración del analista en v1.0.
- Firma electrónica avanzada con certificado digital emitido por autoridad certificadora.
- Portal público de autoregistro para proveedores externos.
- Módulo de reportes estadísticos y dashboards ejecutivos.

---

## 6. Usuarios y Roles

| Rol | Descripción | Permisos clave |
|---|---|---|
| **Proveedor** | Entidad externa evaluada. | Completar y editar su propio formulario. Adjuntar documentos. |
| **Analista de Riesgo** | Revisor interno. | Ver formularios, registrar verificaciones, firmar evaluaciones de riesgo Bajo y Medio. No puede aprobar riesgo Alto. |
| **Oficial de Cumplimiento** | Aprobador final para casos de riesgo Alto. | Todos los permisos del Analista + aprobación/rechazo de riesgo Alto + recepción de alertas críticas. |
| **Administrador** | Gestión de la plataforma. | CRUD de usuarios internos, consulta de logs de auditoría, configuración del sistema. |

---

## 7. Requisitos Funcionales

### 7.1 Módulo: Formulario de Evaluación

**RF-01 — Wizard de 6 Secciones**  
El formulario de debida diligencia debe presentarse como un wizard secuencial de 6 pasos. El avance al siguiente paso solo es posible si todos los campos obligatorios del paso actual están validados correctamente.

Las 6 secciones son:

1. **Identificación del Proveedor** — Razón social, RUC, tipo de persona jurídica/natural, país de origen, nombre del representante legal, número de cédula o pasaporte. *(Base legal: Art. 18, Ley 23/2015; Art. 22, Ley 22/2006)*
2. **Actividad Económica** — Actividad principal, código CIIU, descripción del bien o servicio, identificación del beneficiario final (personas naturales con ≥25% de participación). *(Base legal: Arts. 22 y 24, Ley 23/2015)*
3. **Verificación de Listas Restrictivas** — Registro declarativo de verificación contra: OFAC, ONU, Interpol, Inhabilitados de PanamaCompra. *(Base legal: Arts. 21 y 22, Ley 23/2015; Arts. 36 y 47, Ley 22/2006)*
4. **Evaluación de Riesgo** — Declaración de PEP, jurisdicción GAFI del país de origen, rango de monto anual de transacciones. El nivel de riesgo calculado se muestra como resultado no editable. *(Base legal: Arts. 17 y 22, Ley 23/2015; Recomendaciones GAFI 10 y 19)*
5. **Documentos Requeridos** — Carga obligatoria de: Certificado del Registro Público, RUC emitido por la DGI, identificación del representante legal, declaración jurada de beneficiario final, estados financieros del último período. *(Base legal: Art. 35, Ley 23/2015)*
6. **Firma del Analista** — Nombre, cargo, fecha y declaración de cumplimiento firmada digitalmente por el analista responsable. *(Base legal: RNF-04 — trazabilidad e irrepudiabilidad)*

**RF-02 — Validación por Sección**  
Cada sección debe validar sus campos en el cliente (React) antes de permitir el avance. La validación debe ejecutarse también en el servidor (Hono) antes de persistir los datos.

**RF-03 — Validación de RUC Panameño**  
El campo RUC debe validarse con la expresión regular `/^\d{1,3}-\d{3}-\d{6}$/` para personas jurídicas. El sistema debe también aceptar el formato de cédula panameña para personas naturales.

**RF-04 — Sanitización de Inputs**  
Ningún campo del formulario debe insertar HTML no sanitizado en el DOM. El frontend en React debe gestionar todos los valores mediante estado controlado. Está prohibido el uso de `innerHTML` para renderizar contenido ingresado por el usuario.

---

### 7.2 Módulo: Motor de Scoring de Riesgo

**RF-05 — Cálculo Automático de Nivel de Riesgo**  
El motor de scoring se ejecuta exclusivamente en el backend (Hono) al recibir los datos completos de la Sección 4. El nivel de riesgo resultante se persiste en la tabla `evaluacion_riesgo` y se devuelve al frontend como campo de solo lectura.

**Reglas de scoring (v1.0):**

| Condición | Puntos |
|---|---|
| País de origen en lista GAFI de alto riesgo o no cooperante | +40 |
| Proveedor o representante es PEP | +25 |
| Monto anual de transacciones supera USD 50,000 | +15 |
| Coincidencia declarada en lista restrictiva (cualquiera) | +50 |
| Sin factores de riesgo adicionales | 0 |

**Escala de nivel de riesgo:**

| Puntaje | Nivel |
|---|---|
| 0 – 24 | Bajo |
| 25 – 74 | Medio |
| ≥ 75 | Alto |

**RF-06 — Bloqueo de Aprobación por Nivel Alto**  
Si el nivel de riesgo calculado es Alto (≥75 puntos), el sistema debe impedir que el Analista de Riesgo ejecute la acción de aprobación. El sistema debe generar automáticamente una alerta dirigida al Oficial de Cumplimiento.

---

### 7.3 Módulo: Autenticación y Autorización

**RF-07 — Autenticación con JWT**  
El backend debe implementar autenticación stateless mediante JSON Web Tokens (JWT). El token debe incluir el rol del usuario como claim y ser verificado en cada endpoint protegido mediante middleware de Hono.

**RF-08 — RBAC por Endpoint**  
Cada endpoint de la API debe declarar explícitamente los roles autorizados. Las solicitudes de roles no autorizados deben retornar `403 Forbidden`.

---

### 7.4 Módulo: Auditoría e Inmutabilidad

**RF-09 — Log de Auditoría**  
Cada evento relevante del sistema debe persistir en la tabla `auditoria_log` con: timestamp UTC, ID del usuario que lo ejecutó, rol, acción realizada, ID del recurso afectado y resultado (éxito/fallo). Los registros de esta tabla son de solo inserción (append-only); ningún rol tiene permisos de `UPDATE` o `DELETE` sobre ella.

**RF-10 — Retención de Documentos**  
Los documentos cargados en la Sección 5 deben almacenarse de forma que garanticen disponibilidad por un mínimo de 5 años, conforme al Art. 35 de la Ley 23/2015.

---

## 8. Requisitos No Funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-01 | Seguridad | Todos los endpoints deben requerir autenticación JWT válida. Los tokens deben tener expiración máxima de 8 horas. |
| RNF-02 | Seguridad | Ningún input del usuario debe ser insertado en el DOM sin sanitizar. |
| RNF-03 | Seguridad | El backend debe validar todos los campos recibidos independientemente de la validación del frontend. |
| RNF-04 | Trazabilidad | Todo cambio de estado de un formulario o evaluación debe quedar registrado en el log de auditoría con el usuario responsable. |
| RNF-05 | Mantenibilidad | La lógica de validación del frontend debe estar modularizada en funciones independientes por sección (máximo de complejidad ciclomática de McCabe: 10 por función). |
| RNF-06 | Portabilidad | El sistema completo debe poder levantarse en cualquier entorno con `docker compose up` sin pasos manuales adicionales. |
| RNF-07 | Disponibilidad | El entorno de producción en Railway debe mantener disponibilidad ≥99% durante el ciclo académico de evaluación. |
| RNF-08 | Retención | Los documentos del proveedor deben estar disponibles en el sistema por un mínimo de 5 años. |

---

## 9. Arquitectura Técnica

### 9.1 Stack

| Capa | Tecnología | Justificación |
|---|---|---|
| Runtime | Bun | Velocidad de ejecución, gestión de dependencias nativa, compatibilidad con TypeScript sin configuración adicional. |
| Backend | Hono (TypeScript) | Framework ligero con soporte nativo para Bun. Middleware componible para RBAC y validación. |
| Frontend | Vite + React (TypeScript) | Renderizado eficiente del wizard. Gestión de estado controlado que elimina el uso de `innerHTML`. |
| Estilos | TailwindCSS | Consistencia visual con el prototipo HTML existente. |
| Base de datos | PostgreSQL 16 | Modelo relacional robusto para auditorías, integridad referencial y consultas complejas de riesgo. |
| Contenerización | Docker + Docker Compose | Reproducibilidad del entorno entre desarrollo y producción. |
| Despliegue | Railway | PaaS con soporte nativo para Docker Compose y aprovisionamiento de PostgreSQL en la misma plataforma. |
| CI/CD | GitHub Actions | Filtro de calidad previo al despliegue: linting, pruebas unitarias y verificación de build. |

### 9.2 Estructura del Repositorio

```
serp/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   │   └── scoring.service.ts
│   │   └── db/
│   │       └── schema.sql
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── wizard/
│   │   │       ├── Step1Identificacion.tsx
│   │   │       ├── Step2ActividadEconomica.tsx
│   │   │       ├── Step3ListasRestrictivas.tsx
│   │   │       ├── Step4EvaluacionRiesgo.tsx
│   │   │       ├── Step5Documentos.tsx
│   │   │       └── Step6Firma.tsx
│   │   └── validation/
│   │       ├── validateStep1.ts
│   │       ├── validateStep2.ts
│   │       ├── validateStep3.ts
│   │       ├── validateStep4.ts
│   │       ├── validateStep5.ts
│   │       └── validateStep6.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .github/
    └── workflows/
        └── ci.yml
```

### 9.3 Modelo de Datos (Entidades Principales)

```
PROVEEDOR (id, razon_social, ruc, tipo_persona, pais_origen, rep_legal, doc_identidad, created_at)

FORMULARIO_EVALUACION (id, proveedor_id, estado, paso_actual, datos_json, created_at, updated_at)

EVALUACION_RIESGO (id, formulario_id, puntaje_total, nivel_riesgo, es_pep, es_pais_gafi, monto_rango, created_at)

VERIFICACION_LISTA (id, evaluacion_id, lista_id, resultado_declarado, verificado_por, created_at)

LISTA_RESTRICTIVA (id, nombre, tipo, descripcion)

DOCUMENTO_REQUERIDO (id, formulario_id, tipo_documento, ruta_almacenamiento, uploaded_at)

ALERTA (id, evaluacion_id, tipo, nivel, dirigida_a_rol, leida, created_at)

AUDITORIA_LOG (id, usuario_id, rol, accion, recurso_tipo, recurso_id, resultado, timestamp_utc)
```

### 9.4 Pipeline CI/CD

```
Push a rama main
  → GitHub Actions: lint + typecheck + pruebas unitarias
      → Si pasa: Railway detecta cambio y despliega desde docker-compose.yml
      → Si falla: Deploy bloqueado, notificación al desarrollador
```

El archivo `.github/workflows/ci.yml` debe ejecutar como mínimo:
- `bun run lint` en backend y frontend.
- `bun run typecheck` en backend y frontend.
- `bun run test` para las funciones del motor de scoring y las funciones de validación.

---

## 10. Criterios de Aceptación

| ID | Criterio |
|---|---|
| CA-01 | El campo RUC rechaza en cliente y en servidor cualquier valor que no cumpla con el formato `/^\d{1,3}-\d{3}-\d{6}$/` para personas jurídicas. |
| CA-02 | No existe ninguna instancia de `innerHTML` en el código del frontend que reciba datos del usuario. |
| CA-03 | El endpoint `POST /api/formulario` retorna `201 Created` y los datos son verificables en PostgreSQL. |
| CA-04 | Un usuario autenticado con rol `analista` recibe `403 Forbidden` al intentar invocar el endpoint de aprobación de un proveedor con nivel de riesgo Alto. |
| CA-05 | La combinación PEP + país GAFI + monto >$50,000 produce un puntaje ≥75 y nivel `ALTO` en la tabla `evaluacion_riesgo`. |
| CA-06 | Cada acción de creación, actualización o cambio de estado queda registrada en `auditoria_log` con el ID del usuario responsable. |
| CA-07 | El comando `docker compose up` levanta los tres servicios (backend, frontend, base de datos) sin intervención manual. |
| CA-08 | El pipeline de GitHub Actions bloquea el despliegue si alguna prueba unitaria falla. |
| CA-09 | Las funciones de validación del frontend están separadas por sección y ninguna supera una complejidad ciclomática de McCabe de 10. |

---

## 11. Entregables del Sprint 2

| Entregable | Descripción |
|---|---|
| `docker-compose.yml` funcional | Orquesta backend (Hono/Bun), frontend (Vite/React) y PostgreSQL. |
| Esquema SQL completo | Script `schema.sql` con todas las tablas, relaciones, constraints e índices. |
| API backend — endpoints core | `POST /auth/login`, `POST /api/formulario`, `PUT /api/formulario/:id`, `POST /api/evaluacion`, `GET /api/formulario/:id`. |
| Motor de scoring | Servicio `scoring.service.ts` con lógica de puntuación y pruebas unitarias. |
| Frontend refactorizado | Wizard de 6 pasos con validación modular por sección, sin `innerHTML`. |
| Funciones de validación | 6 archivos `validateStepN.ts` independientes con pruebas unitarias. |
| Pipeline CI/CD | Archivo `.github/workflows/ci.yml` que ejecuta lint, typecheck y tests antes de cada despliegue. |

---

## 12. Restricciones y Supuestos

- El sistema se despliega en Railway utilizando el plan que provee Railway a estudiantes o el tier gratuito disponible al momento del despliegue.
- La verificación contra listas restrictivas externas (OFAC, ONU, Interpol) en v1.0 es declarativa: el analista registra el resultado de su verificación manual. La integración con APIs externas queda fuera del alcance de esta versión.
- La firma del analista en la Sección 6 es una firma electrónica simple (nombre + timestamp + hash del formulario) y no requiere certificado digital de autoridad certificadora en v1.0.
- PostgreSQL es aprovisionado directamente en Railway como servicio gestionado en el mismo proyecto.
