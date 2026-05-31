import type { RiskInput, RiskLevel, RiskResult } from "../types";

export function calculateRisk(input: RiskInput): RiskResult {
  let score = 0;

  if (input.esPaisGafi) {
    score += 40;
  }

  if (input.esPep) {
    score += 25;
  }

  if (input.montoAnualUsd > 50000) {
    score += 15;
  }

  if (input.coincidenciaLista) {
    score += 50;
  }

  const level: RiskLevel = score >= 75 ? "ALTO" : score >= 25 ? "MEDIO" : "BAJO";

  return { score, level };
}
