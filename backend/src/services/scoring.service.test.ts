import { describe, expect, it } from "vitest";
import { calculateRisk } from "./scoring.service";

describe("calculateRisk", () => {
  it("returns BAJO with no risk factors", () => {
    const result = calculateRisk({
      esPaisGafi: false,
      esPep: false,
      montoAnualUsd: 1000,
      coincidenciaLista: false
    });

    expect(result.score).toBe(0);
    expect(result.level).toBe("BAJO");
  });

  it("returns ALTO with PEP + GAFI + amount > 50k", () => {
    const result = calculateRisk({
      esPaisGafi: true,
      esPep: true,
      montoAnualUsd: 70000,
      coincidenciaLista: false
    });

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.level).toBe("ALTO");
  });

  it("returns MEDIO when only restrictive list matches", () => {
    const result = calculateRisk({
      esPaisGafi: false,
      esPep: false,
      montoAnualUsd: 1000,
      coincidenciaLista: true
    });

    expect(result.score).toBe(50);
    expect(result.level).toBe("MEDIO");
  });
});
