export type UserRole = "proveedor" | "analista" | "oficial_cumplimiento" | "administrador";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface ProviderData {
  razonSocial: string;
  ruc: string;
  tipoPersona: "" | "natural" | "juridica" | "extranjera";
  paisOrigen: string;
  fechaVerificacion: string;
  representanteLegal: string;
  documentoIdentidad: string;
}

export interface EconomicData {
  actividadPrincipal: string;
  ciiu: string;
  descripcionServicio: string;
  beneficiarioFinal: string;
}

export interface ListasData {
  ofac: "" | "si" | "no";
  onu: "" | "si" | "no";
  interpol: "" | "si" | "no";
  panamaCompra: "" | "si" | "no";
}

export interface RiskData {
  esPaisGafi: "" | "si" | "no";
  esPep: "" | "si" | "no";
  montoRango: "" | "0-5k" | "5k-25k" | "25k-100k" | "100k-500k" | "+500k";
  puntaje: number | null;
  nivelRiesgo: "" | "BAJO" | "MEDIO" | "ALTO";
  observaciones: string;
}

export interface DocumentsData {
  certificadoRegistroPublico: boolean;
  rucDgi: boolean;
  idRepresentante: boolean;
  declaracionBeneficiario: boolean;
  estadosFinancieros: boolean;
}

export interface DocumentFilesData {
  certificadoRegistroPublico: string | null;
  rucDgi: string | null;
  idRepresentante: string | null;
  declaracionBeneficiario: string | null;
  estadosFinancieros: string | null;
}

export interface SignatureData {
  nombreAnalista: string;
  cargoAnalista: string;
  fechaAnalisis: string;
  firmaAceptada: boolean;
}

export interface WizardData {
  proveedor: ProviderData;
  economica: EconomicData;
  listas: ListasData;
  riesgo: RiskData;
  documentos: DocumentsData;
  documentosArchivos: DocumentFilesData;
  firma: SignatureData;
}

export const initialWizardData: WizardData = {
  proveedor: {
    razonSocial: "",
    ruc: "",
    tipoPersona: "",
    paisOrigen: "",
    fechaVerificacion: "",
    representanteLegal: "",
    documentoIdentidad: ""
  },
  economica: {
    actividadPrincipal: "",
    ciiu: "",
    descripcionServicio: "",
    beneficiarioFinal: ""
  },
  listas: {
    ofac: "",
    onu: "",
    interpol: "",
    panamaCompra: ""
  },
  riesgo: {
    esPaisGafi: "",
    esPep: "",
    montoRango: "",
    puntaje: null,
    nivelRiesgo: "",
    observaciones: ""
  },
  documentos: {
    certificadoRegistroPublico: false,
    rucDgi: false,
    idRepresentante: false,
    declaracionBeneficiario: false,
    estadosFinancieros: false
  },
  documentosArchivos: {
    certificadoRegistroPublico: null,
    rucDgi: null,
    idRepresentante: null,
    declaracionBeneficiario: null,
    estadosFinancieros: null
  },
  firma: {
    nombreAnalista: "",
    cargoAnalista: "",
    fechaAnalisis: "",
    firmaAceptada: false
  }
};
