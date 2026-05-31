import type { RiskData } from "../../types";

interface Step4Props {
  data: RiskData;
  onChange: (patch: Partial<RiskData>) => void;
  onCalculate: () => Promise<void>;
  isCalculating: boolean;
}

export function Step4EvaluacionRiesgo({ data, onChange, onCalculate, isCalculating }: Step4Props) {
  return (
    <div className="step-grid">
      <div className="field">
        <label>Pais de alto riesgo GAFI<span className="req-mark">*</span></label>
        <select
          value={data.esPaisGafi}
          onChange={(event) =>
            onChange({ esPaisGafi: event.target.value as RiskData["esPaisGafi"] })
          }
        >
          <option value="">Seleccionar</option>
          <option value="si">Si</option>
          <option value="no">No</option>
        </select>
      </div>

      <div className="field">
        <label>Proveedor es PEP<span className="req-mark">*</span></label>
        <select
          value={data.esPep}
          onChange={(event) => onChange({ esPep: event.target.value as RiskData["esPep"] })}
        >
          <option value="">Seleccionar</option>
          <option value="si">Si</option>
          <option value="no">No</option>
        </select>
      </div>

      <div className="field full">
        <label>Monto anual de transacciones en USD<span className="req-mark">*</span></label>
        <select
          value={data.montoRango}
          onChange={(event) => onChange({ montoRango: event.target.value as RiskData["montoRango"] })}
        >
          <option value="">Seleccionar</option>
          <option value="0-5k">Menos de 5,000</option>
          <option value="5k-25k">5,000 - 25,000</option>
          <option value="25k-100k">25,000 - 100,000</option>
          <option value="100k-500k">100,000 - 500,000</option>
          <option value="+500k">Mas de 500,000</option>
        </select>
      </div>

      <div className="field full">
        <label>Nivel de riesgo calculado<span className="req-mark">*</span></label>
      </div>

      <div className="field full">
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            void onCalculate();
          }}
          disabled={isCalculating}
        >
          {isCalculating ? "Calculando..." : "Calcular riesgo"}
        </button>
      </div>

      <div className="field">
        <label>Puntaje</label>
        <input type="text" value={data.puntaje ?? ""} readOnly />
      </div>

      <div className="field">
        <label>Nivel de riesgo</label>
        <input type="text" value={data.nivelRiesgo} readOnly />
      </div>

      <div className="field full">
        <label>Observaciones del analista</label>
        <textarea
          value={data.observaciones}
          onChange={(event) => onChange({ observaciones: event.target.value })}
          placeholder="Notas de soporte para la evaluacion"
        />
      </div>
    </div>
  );
}
