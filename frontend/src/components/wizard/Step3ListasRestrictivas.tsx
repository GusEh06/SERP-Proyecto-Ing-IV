import type { ListasData } from "../../types";

interface Step3Props {
  data: ListasData;
  onChange: (patch: Partial<ListasData>) => void;
}

const LISTAS: Array<{ key: keyof ListasData; label: string }> = [
  { key: "ofac", label: "Lista OFAC" },
  { key: "onu", label: "Lista de sanciones ONU" },
  { key: "interpol", label: "Base Interpol" },
  { key: "panamaCompra", label: "Inhabilitados PanamaCompra" }
];

export function Step3ListasRestrictivas({ data, onChange }: Step3Props) {
  return (
    <div className="step-grid">
      {LISTAS.map((lista) => (
        <div className="field full" key={lista.key}>
          <label>{lista.label}<span className="req-mark">*</span></label>
          <div className="segmented-control">
            <button
              type="button"
              className={data[lista.key] === "no" ? "selected" : ""}
              onClick={() => onChange({ [lista.key]: "no" })}
            >
              Sin coincidencia
            </button>
            <button
              type="button"
              className={data[lista.key] === "si" ? "selected warning" : ""}
              onClick={() => onChange({ [lista.key]: "si" })}
            >
              Coincidencia
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
