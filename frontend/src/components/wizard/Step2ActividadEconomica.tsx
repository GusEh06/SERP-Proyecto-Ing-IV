import type { EconomicData } from "../../types";

interface Step2Props {
  data: EconomicData;
  onChange: (patch: Partial<EconomicData>) => void;
}

export function Step2ActividadEconomica({ data, onChange }: Step2Props) {
  return (
    <div className="step-grid">
      <div className="field">
        <label htmlFor="actividadPrincipal">Actividad economica principal<span className="req-mark">*</span></label>
        <select
          id="actividadPrincipal"
          value={data.actividadPrincipal}
          onChange={(event) => onChange({ actividadPrincipal: event.target.value })}
        >
          <option value="">Seleccionar</option>
          <option value="comercio">Comercio al por mayor y menor</option>
          <option value="construccion">Construccion</option>
          <option value="servicios">Servicios profesionales</option>
          <option value="tecnologia">Tecnologia e informatica</option>
          <option value="salud">Salud y farmaceutica</option>
          <option value="finanzas">Servicios financieros</option>
          <option value="transporte">Transporte y logistica</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="ciiu">Codigo CIIU</label>
        <input
          id="ciiu"
          type="text"
          value={data.ciiu}
          maxLength={6}
          onChange={(event) => onChange({ ciiu: event.target.value.replace(/[^0-9]/g, "") })}
        />
      </div>

      <div className="field full">
        <label htmlFor="descripcionServicio">Descripcion del bien o servicio<span className="req-mark">*</span></label>
        <textarea
          id="descripcionServicio"
          value={data.descripcionServicio}
          onChange={(event) => onChange({ descripcionServicio: event.target.value })}
        />
      </div>

      <div className="field full">
        <label htmlFor="beneficiarioFinal">Beneficiario final<span className="req-mark">*</span></label>
        <input
          id="beneficiarioFinal"
          type="text"
          value={data.beneficiarioFinal}
          onChange={(event) =>
            onChange({ beneficiarioFinal: event.target.value.replace(/[^a-zA-Z\s\-.]/g, "") })
          }
        />
      </div>
    </div>
  );
}
