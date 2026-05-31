import type { SignatureData } from "../../types";

interface Step6Props {
  data: SignatureData;
  listasCompletadas: number;
  documentosCompletados: number;
  onChange: (patch: Partial<SignatureData>) => void;
}

export function Step6Firma({ data, listasCompletadas, documentosCompletados, onChange }: Step6Props) {
  return (
    <div className="step-grid">
      <div className="field full declaration-box">
        Declaro que la informacion contenida en este formulario es veridica y que se realizo la debida diligencia
        conforme a la Ley 23 de 2015 y la Ley 22 de 2006 de la Republica de Panama.
      </div>

      <div className="field full summary-wrap">
        <div className="summary-card">
          <strong>5/5</strong>
          <span>Secciones previas</span>
        </div>
        <div className="summary-card">
          <strong>{listasCompletadas}/4</strong>
          <span>Listas consultadas</span>
        </div>
        <div className="summary-card">
          <strong>{documentosCompletados}/5</strong>
          <span>Documentos verificados</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="nombreAnalista">Nombre del analista<span className="req-mark">*</span></label>
        <input
          id="nombreAnalista"
          type="text"
          value={data.nombreAnalista}
          onChange={(event) =>
            onChange({ nombreAnalista: event.target.value.replace(/[^a-zA-Z\s\-.]/g, "") })
          }
        />
      </div>

      <div className="field">
        <label htmlFor="cargoAnalista">Cargo<span className="req-mark">*</span></label>
        <input
          id="cargoAnalista"
          type="text"
          value={data.cargoAnalista}
          onChange={(event) => onChange({ cargoAnalista: event.target.value.replace(/[^a-zA-Z\s\-.]/g, "") })}
        />
      </div>

      <div className="field full">
        <label htmlFor="fechaAnalisis">Fecha del analisis<span className="req-mark">*</span></label>
        <input
          id="fechaAnalisis"
          type="date"
          value={data.fechaAnalisis}
          onChange={(event) => onChange({ fechaAnalisis: event.target.value })}
        />
      </div>

      <label className="check-row full">
        <input
          type="checkbox"
          checked={data.firmaAceptada}
          onChange={(event) => onChange({ firmaAceptada: event.target.checked })}
        />
        <span>Haga clic para firmar electronicamente<span className="req-mark">*</span></span>
      </label>
    </div>
  );
}
