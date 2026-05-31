import type { ProviderData } from "../../types";

interface Step1Props {
  data: ProviderData;
  onChange: (patch: Partial<ProviderData>) => void;
}

export function Step1Identificacion({ data, onChange }: Step1Props) {
  return (
    <div className="step-grid">
      <div className="field full">
        <label htmlFor="razonSocial">Razon social o nombre legal<span className="req-mark">*</span></label>
        <input
          id="razonSocial"
          type="text"
          value={data.razonSocial}
          onChange={(event) =>
            onChange({ razonSocial: event.target.value.replace(/[^a-zA-Z0-9\s.,'&-]/g, "") })
          }
        />
      </div>

      <div className="field">
        <label htmlFor="tipoPersona">Tipo de persona<span className="req-mark">*</span></label>
        <select
          id="tipoPersona"
          value={data.tipoPersona}
          onChange={(event) =>
            onChange({ tipoPersona: event.target.value as ProviderData["tipoPersona"] })
          }
        >
          <option value="">Seleccionar</option>
          <option value="natural">Persona natural</option>
          <option value="juridica">Persona juridica</option>
          <option value="extranjera">Empresa extranjera</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="ruc">RUC o identificacion fiscal<span className="req-mark">*</span></label>
        <input
          id="ruc"
          type="text"
          value={data.ruc}
          onChange={(event) => onChange({ ruc: event.target.value.replace(/[^0-9A-Za-z-]/g, "") })}
          placeholder="Ejemplo 8-123-456789"
        />
      </div>

      <div className="field">
        <label htmlFor="paisOrigen">Pais de origen<span className="req-mark">*</span></label>
        <select
          id="paisOrigen"
          value={data.paisOrigen}
          onChange={(event) => onChange({ paisOrigen: event.target.value })}
        >
          <option value="">Seleccionar</option>
          <option value="PA">Panama</option>
          <option value="CO">Colombia</option>
          <option value="US">Estados Unidos</option>
          <option value="MX">Mexico</option>
          <option value="ES">Espana</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="fechaVerificacion">Fecha de verificacion<span className="req-mark">*</span></label>
        <input
          id="fechaVerificacion"
          type="date"
          value={data.fechaVerificacion}
          onChange={(event) => onChange({ fechaVerificacion: event.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="representanteLegal">Representante legal<span className="req-mark">*</span></label>
        <input
          id="representanteLegal"
          type="text"
          value={data.representanteLegal}
          onChange={(event) =>
            onChange({ representanteLegal: event.target.value.replace(/[^a-zA-Z\s\-.]/g, "") })
          }
        />
      </div>

      <div className="field">
        <label htmlFor="documentoIdentidad">Cedula o pasaporte del representante<span className="req-mark">*</span></label>
        <input
          id="documentoIdentidad"
          type="text"
          value={data.documentoIdentidad}
          onChange={(event) =>
            onChange({ documentoIdentidad: event.target.value.replace(/[^0-9A-Za-z-]/g, "") })
          }
        />
      </div>
    </div>
  );
}
