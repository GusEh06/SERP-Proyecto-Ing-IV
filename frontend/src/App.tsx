import { useEffect, useMemo, useState } from "react";
import { Step1Identificacion } from "./components/wizard/Step1Identificacion";
import { Step2ActividadEconomica } from "./components/wizard/Step2ActividadEconomica";
import { Step3ListasRestrictivas } from "./components/wizard/Step3ListasRestrictivas";
import { Step4EvaluacionRiesgo } from "./components/wizard/Step4EvaluacionRiesgo";
import { Step5Documentos } from "./components/wizard/Step5Documentos";
import { Step6Firma } from "./components/wizard/Step6Firma";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import type { WizardData } from "./types";
import { initialWizardData } from "./types";
import { validateStep1 } from "./validation/validateStep1";
import { validateStep2 } from "./validation/validateStep2";
import { validateStep3 } from "./validation/validateStep3";
import { validateStep4 } from "./validation/validateStep4";
import { validateStep5 } from "./validation/validateStep5";
import { validateStep6 } from "./validation/validateStep6";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

const STEP_TITLES = [
  "Identificacion del proveedor",
  "Actividad economica",
  "Listas restrictivas",
  "Evaluacion de riesgo",
  "Documentos requeridos",
  "Firma del analista"
];

const FORM_STORAGE_KEY = "serp.formulario.v1";
const FORM_STORAGE_VERSION = 2;
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWizardData(raw: unknown): WizardData {
  if (!isRecord(raw)) {
    return initialWizardData;
  }

  const proveedor = isRecord(raw.proveedor) ? raw.proveedor : {};
  const economica = isRecord(raw.economica) ? raw.economica : {};
  const listas = isRecord(raw.listas) ? raw.listas : {};
  const riesgo = isRecord(raw.riesgo) ? raw.riesgo : {};
  const documentos = isRecord(raw.documentos) ? raw.documentos : {};
  const documentosArchivos = isRecord(raw.documentosArchivos) ? raw.documentosArchivos : {};
  const firma = isRecord(raw.firma) ? raw.firma : {};

  return {
    proveedor: { ...initialWizardData.proveedor, ...proveedor },
    economica: { ...initialWizardData.economica, ...economica },
    listas: { ...initialWizardData.listas, ...listas },
    riesgo: { ...initialWizardData.riesgo, ...riesgo },
    documentos: { ...initialWizardData.documentos, ...documentos },
    documentosArchivos: { ...initialWizardData.documentosArchivos, ...documentosArchivos },
    firma: { ...initialWizardData.firma, ...firma }
  };
}

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentView, setCurrentView] = useState<"wizard" | "dashboard">("wizard");
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizardData);
  const [errors, setErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmittingToApi, setIsSubmittingToApi] = useState(false);

  const completion = useMemo(() => ((currentStep + 1) / 6) * 100, [currentStep]);

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogout = async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    setCurrentView("wizard");
  };

  const renderNav = (active: "wizard" | "dashboard") => (
    <nav className="nav-bar">
      <span className="nav-brand">SERP</span>
      <div className="nav-links">
        <button
          type="button"
          className={`nav-link ${active === "wizard" ? "active" : ""}`}
          onClick={() => setCurrentView("wizard")}
        >
          Formulario
        </button>
        <button
          type="button"
          className={`nav-link ${active === "dashboard" ? "active" : ""}`}
          onClick={() => setCurrentView("dashboard")}
        >
          Dashboard
        </button>
        <button type="button" className="btn ghost" onClick={() => void handleLogout()}>
          Cerrar sesion
        </button>
      </div>
    </nav>
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FORM_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as {
        version?: number;
        currentStep?: number;
        wizardData?: unknown;
        submitted?: boolean;
        statusMessage?: string;
      };

      if (typeof parsed.currentStep === "number" && parsed.currentStep >= 0 && parsed.currentStep <= 5) {
        setCurrentStep(parsed.currentStep);
      }

      if (parsed.wizardData) {
        setWizardData(normalizeWizardData(parsed.wizardData));
      }

      if (typeof parsed.submitted === "boolean") {
        setSubmitted(parsed.submitted);
      }

      if (typeof parsed.statusMessage === "string") {
        setStatusMessage(parsed.statusMessage);
      }
    } catch {
      window.localStorage.removeItem(FORM_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const snapshot = {
      version: FORM_STORAGE_VERSION,
      currentStep,
      wizardData,
      submitted,
      statusMessage
    };

    window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(snapshot));
  }, [currentStep, wizardData, submitted, statusMessage]);

  const runStepValidation = (step: number): string[] => {
    if (step === 0) return validateStep1(wizardData.proveedor);
    if (step === 1) return validateStep2(wizardData.economica);
    if (step === 2) return validateStep3(wizardData.listas);
    if (step === 3) return validateStep4(wizardData.riesgo);
    if (step === 4) return validateStep5(wizardData.documentos);
    if (step === 5) return validateStep6(wizardData.firma);
    return [];
  };

  const calculateRisk = (): { puntaje: number; nivelRiesgo: "BAJO" | "MEDIO" | "ALTO" } => {
    let puntaje = 0;

    if (wizardData.riesgo.esPaisGafi === "si") puntaje += 40;
    if (wizardData.riesgo.esPep === "si") puntaje += 25;
    if (["25k-100k", "100k-500k", "+500k"].includes(wizardData.riesgo.montoRango)) puntaje += 15;
    if (Object.values(wizardData.listas).some((value) => value === "si")) puntaje += 50;

    const nivelRiesgo = puntaje >= 75 ? "ALTO" : puntaje >= 25 ? "MEDIO" : "BAJO";
    return { puntaje, nivelRiesgo };
  };

  const handleRiskCalculation = async () => {
    setStatusMessage("");
    const stepErrors = validateStep4(wizardData.riesgo).filter(
      (error) => error !== "Debe calcularse el nivel de riesgo antes de continuar"
    );

    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors([]);
    setIsCalculating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const evaluacion = calculateRisk();

      setWizardData((current) => ({
        ...current,
        riesgo: {
          ...current.riesgo,
          puntaje: evaluacion.puntaje,
          nivelRiesgo: evaluacion.nivelRiesgo
        }
      }));
      setStatusMessage("Riesgo calculado correctamente.");
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "No fue posible calcular el riesgo"]);
    } finally {
      setIsCalculating(false);
    }
  };

  const goNext = () => {
    const stepErrors = runStepValidation(currentStep);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors([]);
    setStatusMessage("");
    setCurrentStep((step) => Math.min(step + 1, 5));
  };

  const goBack = () => {
    setErrors([]);
    setStatusMessage("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const submitForm = async () => {
    const stepErrors = runStepValidation(5);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);
    setIsSubmittingToApi(true);

    try {
      const payload = {
        proveedor: {
          razonSocial: wizardData.proveedor.razonSocial,
          ruc: wizardData.proveedor.ruc,
          tipoPersona: wizardData.proveedor.tipoPersona,
          paisOrigen: wizardData.proveedor.paisOrigen,
          representanteLegal: wizardData.proveedor.representanteLegal,
          documentoIdentidad: wizardData.proveedor.documentoIdentidad
        },
        datos: wizardData
      };

      const response = await fetch(`${API_BASE}/api/public/formulario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          issues?: Array<{ path?: (string | number)[]; message?: string }>;
        };
        const issueMessages = Array.isArray(data.issues)
          ? data.issues
              .map((issue) =>
                [issue.path?.join("."), issue.message].filter(Boolean).join(": ")
              )
              .filter(Boolean)
          : [];
        const combined = [data.message, ...issueMessages].filter(Boolean);
        throw new Error(
          combined.length > 0 ? combined.join(" | ") : "No fue posible enviar el formulario"
        );
      }

      setSubmitted(true);
      setStatusMessage("Formulario enviado correctamente.");
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "No fue posible finalizar el formulario"]);
    } finally {
      setIsSubmitting(false);
      setIsSubmittingToApi(false);
    }
  };

  if (!authChecked) {
    return (
      <main className="page">
        <p style={{ color: "var(--muted)", textAlign: "center", padding: "4rem" }}>Cargando...</p>
      </main>
    );
  }

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  if (submitted) {
    return (
      <main className="page">
        {renderNav("wizard")}

        <header className="hero">
          <h1>Formulario SERP</h1>
          <p>Registro de debida diligencia AML/CFT para proveedores.</p>
        </header>

        <section className="wizard-shell">
          <section className="wizard-card">
            <h2>Formulario recibido</h2>
            <p>La informacion fue registrada correctamente.</p>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setWizardData(initialWizardData);
                setCurrentStep(0);
                setErrors([]);
                setStatusMessage("");
                setSubmitted(false);
                window.localStorage.removeItem(FORM_STORAGE_KEY);
              }}
            >
              Registrar otro formulario
            </button>
          </section>
        </section>
      </main>
    );
  }

  if (currentView === "dashboard") {
    return (
      <main className="page">
        {renderNav("dashboard")}

        <header className="hero compact">
          <h1>Dashboard SERP</h1>
          <div className="hero-meta">
            <span>Metricas de evaluacion de proveedores</span>
          </div>
        </header>

        <Dashboard />
      </main>
    );
  }

  return (
    <main className="page">
      {renderNav("wizard")}

      <header className="hero compact">
        <h1>Formulario SERP</h1>
        <div className="hero-meta">
          <span>Debida diligencia de proveedores</span>
        </div>
      </header>

      <section className="wizard-shell">
        <div className="progress-header">
          <div>
            <h2>{STEP_TITLES[currentStep]}</h2>
            <p>Paso {currentStep + 1} de 6</p>
            <p className="required-note">
              <span className="req-mark">*</span> Los campos con asterisco son obligatorios.
            </p>
          </div>
          <strong>{Math.round(completion)}%</strong>
        </div>

        <div className="progress-track">
          <div className="progress-value" style={{ width: `${completion}%` }} />
        </div>

        <ol className="step-indicator" aria-label="Progreso del formulario">
          {STEP_TITLES.map((title, index) => (
            <li key={title} className={index === currentStep ? "active" : index < currentStep ? "done" : ""}>
              <span>{index + 1}</span>
              <small>{title}</small>
            </li>
          ))}
        </ol>

        <section className="wizard-card">
          {currentStep === 0 ? (
            <Step1Identificacion
              data={wizardData.proveedor}
              onChange={(patch) =>
                setWizardData((current) => ({ ...current, proveedor: { ...current.proveedor, ...patch } }))
              }
            />
          ) : null}

          {currentStep === 1 ? (
            <Step2ActividadEconomica
              data={wizardData.economica}
              onChange={(patch) =>
                setWizardData((current) => ({ ...current, economica: { ...current.economica, ...patch } }))
              }
            />
          ) : null}

          {currentStep === 2 ? (
            <Step3ListasRestrictivas
              data={wizardData.listas}
              onChange={(patch) =>
                setWizardData((current) => ({ ...current, listas: { ...current.listas, ...patch } }))
              }
            />
          ) : null}

          {currentStep === 3 ? (
            <Step4EvaluacionRiesgo
              data={wizardData.riesgo}
              onChange={(patch) =>
                setWizardData((current) => ({ ...current, riesgo: { ...current.riesgo, ...patch } }))
              }
              onCalculate={handleRiskCalculation}
              isCalculating={isCalculating}
            />
          ) : null}

          {currentStep === 4 ? (
            <Step5Documentos
              data={wizardData.documentos}
              files={wizardData.documentosArchivos}
              onChange={(patch) =>
                setWizardData((current) => ({ ...current, documentos: { ...current.documentos, ...patch } }))
              }
              onFileChange={(patch) =>
                setWizardData((current) => ({
                  ...current,
                  documentosArchivos: { ...current.documentosArchivos, ...patch }
                }))
              }
            />
          ) : null}

          {currentStep === 5 ? (
            <Step6Firma
              data={wizardData.firma}
              listasCompletadas={Object.values(wizardData.listas).filter((value) => value !== "").length}
              documentosCompletados={Object.values(wizardData.documentos).filter(Boolean).length}
              onChange={(patch) =>
                setWizardData((current) => ({ ...current, firma: { ...current.firma, ...patch } }))
              }
            />
          ) : null}
        </section>

        {errors.length > 0 ? (
          <aside className="error-list" role="alert">
            <strong>Revise los siguientes campos:</strong>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </aside>
        ) : null}

        {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

        <section className="process-note" aria-label="Contexto del formulario">
          <strong>Importante:</strong> este formulario valida cada seccion antes de permitir avanzar.
        </section>

        <footer className="wizard-actions">
          <button type="button" className="btn ghost" onClick={goBack} disabled={currentStep === 0}>
            Anterior
          </button>

          {currentStep < 5 ? (
            <button type="button" className="btn primary" onClick={goNext}>
              Siguiente
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => void submitForm()} disabled={isSubmitting}>
              {isSubmitting
                ? isSubmittingToApi
                  ? "Enviando a plataforma..."
                  : "Procesando..."
                : "Enviar formulario"}
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}
