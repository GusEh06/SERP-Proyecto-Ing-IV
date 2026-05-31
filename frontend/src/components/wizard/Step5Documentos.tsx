import type { DocumentFilesData, DocumentsData } from "../../types";

interface Step5Props {
  data: DocumentsData;
  files: DocumentFilesData;
  onChange: (patch: Partial<DocumentsData>) => void;
  onFileChange: (patch: Partial<DocumentFilesData>) => void;
}

const DOCUMENTS: Array<{ key: keyof DocumentsData; label: string }> = [
  { key: "certificadoRegistroPublico", label: "Certificado del Registro Publico" },
  { key: "rucDgi", label: "RUC emitido por DGI" },
  { key: "idRepresentante", label: "Identificacion del representante legal" },
  { key: "declaracionBeneficiario", label: "Declaracion jurada del beneficiario final" },
  { key: "estadosFinancieros", label: "Estados financieros del ultimo periodo" }
];

export function Step5Documentos({ data, files, onChange, onFileChange }: Step5Props) {
  return (
    <div className="step-grid">
      {DOCUMENTS.map((documentItem) => (
        <div className="check-row full" key={documentItem.key}>
          <label className="check-label">
            <input
              type="checkbox"
              checked={Boolean(data[documentItem.key])}
              onChange={(event) =>
                onChange({ [documentItem.key]: event.target.checked } as Partial<DocumentsData>)
              }
            />
            <span>{documentItem.label}<span className="req-mark">*</span></span>
          </label>

          <label className="upload-inline" htmlFor={`file-${documentItem.key}`}>
            Adjuntar
          </label>
          <input
            id={`file-${documentItem.key}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            onChange={(event) => {
              const fileName = event.target.files?.[0]?.name ?? null;
              onFileChange({ [documentItem.key]: fileName } as Partial<DocumentFilesData>);
              if (fileName) {
                onChange({ [documentItem.key]: true } as Partial<DocumentsData>);
              }
            }}
          />
          {files[documentItem.key] ? <small className="file-name">{files[documentItem.key]}</small> : null}
          {files[documentItem.key] ? (
            <button
              type="button"
              className="file-remove"
              onClick={() => onFileChange({ [documentItem.key]: null } as Partial<DocumentFilesData>)}
            >
              Quitar
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
