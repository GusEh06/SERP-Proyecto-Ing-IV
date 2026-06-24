import { useState } from "react";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";

interface LoginProps {
  onLogin: (user: { id: number; name: string; email: string; role: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      if (res.status === 429) {
        setError("Demasiados intentos. Espere 5 minutos.");
        return;
      }

      if (!res.ok) {
        setError("Credenciales invalidas.");
        return;
      }

      const data = await res.json() as { user: { id: number; name: string; email: string; role: string } };
      onLogin(data.user);
    } catch {
      setError("Error de conexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <header className="hero">
        <h1>SERP</h1>
        <p>Sistema de Evaluacion de Riesgo de Proveedores</p>
      </header>

      <section className="wizard-shell">
        <section className="auth-panel">
          <h2>Iniciar sesion</h2>
          <p>Ingrese sus credenciales para acceder al sistema.</p>

          <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="field">
              <label htmlFor="email">Correo electronico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Contrasena</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error ? <div className="error-box">{error}</div> : null}

            <button type="submit" className="btn primary" disabled={isLoading}>
              {isLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
