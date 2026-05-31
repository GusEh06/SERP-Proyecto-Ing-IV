import { describe, expect, it } from "vitest";
import { validateStep1 } from "./validateStep1";
import { validateStep2 } from "./validateStep2";
import { validateStep3 } from "./validateStep3";
import { validateStep4 } from "./validateStep4";
import { validateStep5 } from "./validateStep5";
import { validateStep6 } from "./validateStep6";

describe("wizard validations", () => {
  it("validates step 1 required fields and RUC format", () => {
    const errors = validateStep1({
      razonSocial: "Empresa SA",
      ruc: "8-123-456789",
      tipoPersona: "juridica",
      paisOrigen: "Panama",
      fechaVerificacion: "2026-01-02",
      representanteLegal: "Ana Perez",
      documentoIdentidad: "8-123-456"
    });

    expect(errors).toHaveLength(0);

    const invalid = validateStep1({
      razonSocial: "Empresa SA",
      ruc: "invalido",
      tipoPersona: "juridica",
      paisOrigen: "Panama",
      fechaVerificacion: "2026-01-02",
      representanteLegal: "Ana Perez",
      documentoIdentidad: "8-123-456"
    });

    expect(invalid.some((error) => error.includes("RUC"))).toBe(true);
  });

  it("validates step 2 required fields", () => {
    const valid = validateStep2({
      actividadPrincipal: "Servicios",
      ciiu: "6201",
      descripcionServicio: "Servicios de consultoria",
      beneficiarioFinal: "Carlos Lopez"
    });

    expect(valid).toHaveLength(0);

    const invalid = validateStep2({
      actividadPrincipal: "",
      ciiu: "abc",
      descripcionServicio: "",
      beneficiarioFinal: ""
    });

    expect(invalid.length).toBeGreaterThan(0);
  });

  it("requires all restrictive list decisions in step 3", () => {
    const valid = validateStep3({ ofac: "no", onu: "no", interpol: "si", panamaCompra: "no" });
    expect(valid).toHaveLength(0);

    const invalid = validateStep3({ ofac: "", onu: "no", interpol: "si", panamaCompra: "no" });
    expect(invalid.length).toBe(1);
  });

  it("requires backend calculation fields in step 4", () => {
    const valid = validateStep4({
      esPaisGafi: "no",
      esPep: "no",
      montoRango: "0-5k",
      puntaje: 0,
      nivelRiesgo: "BAJO",
      observaciones: ""
    });
    expect(valid).toHaveLength(0);

    const invalid = validateStep4({
      esPaisGafi: "",
      esPep: "",
      montoRango: "",
      puntaje: null,
      nivelRiesgo: "",
      observaciones: ""
    });
    expect(invalid.length).toBeGreaterThan(0);
  });

  it("requires all mandatory documents in step 5", () => {
    const valid = validateStep5({
      certificadoRegistroPublico: true,
      rucDgi: true,
      idRepresentante: true,
      declaracionBeneficiario: true,
      estadosFinancieros: true
    });
    expect(valid).toHaveLength(0);

    const invalid = validateStep5({
      certificadoRegistroPublico: true,
      rucDgi: false,
      idRepresentante: true,
      declaracionBeneficiario: true,
      estadosFinancieros: true
    });
    expect(invalid.length).toBe(1);
  });

  it("requires analyst signature data in step 6", () => {
    const valid = validateStep6({
      nombreAnalista: "Laura Gomez",
      cargoAnalista: "Analista de Riesgo",
      fechaAnalisis: "2026-01-10",
      firmaAceptada: true
    });
    expect(valid).toHaveLength(0);

    const invalid = validateStep6({
      nombreAnalista: "",
      cargoAnalista: "",
      fechaAnalisis: "",
      firmaAceptada: false
    });
    expect(invalid.length).toBe(4);
  });
});
