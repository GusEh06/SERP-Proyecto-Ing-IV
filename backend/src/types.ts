export type UserRole = "proveedor" | "analista" | "oficial_cumplimiento" | "administrador";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

export interface RiskInput {
  esPaisGafi: boolean;
  esPep: boolean;
  montoAnualUsd: number;
  coincidenciaLista: boolean;
}

export type RiskLevel = "BAJO" | "MEDIO" | "ALTO";

export interface RiskResult {
  score: number;
  level: RiskLevel;
}
