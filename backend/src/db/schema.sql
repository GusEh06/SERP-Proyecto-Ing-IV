CREATE TABLE IF NOT EXISTS usuario (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(140) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(40) NOT NULL CHECK (rol IN ('proveedor', 'analista', 'oficial_cumplimiento', 'administrador', 'sistema')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedor (
  id BIGSERIAL PRIMARY KEY,
  razon_social VARCHAR(180) NOT NULL,
  ruc VARCHAR(24) NOT NULL,
  tipo_persona VARCHAR(24) NOT NULL,
  pais_origen VARCHAR(80) NOT NULL,
  rep_legal VARCHAR(140) NOT NULL,
  doc_identidad VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formulario_evaluacion (
  id BIGSERIAL PRIMARY KEY,
  proveedor_id BIGINT NOT NULL REFERENCES proveedor(id),
  estado VARCHAR(30) NOT NULL DEFAULT 'borrador',
  paso_actual SMALLINT NOT NULL DEFAULT 1,
  datos_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluacion_riesgo (
  id BIGSERIAL PRIMARY KEY,
  formulario_id BIGINT NOT NULL UNIQUE REFERENCES formulario_evaluacion(id),
  puntaje_total INTEGER NOT NULL,
  nivel_riesgo VARCHAR(20) NOT NULL CHECK (nivel_riesgo IN ('BAJO', 'MEDIO', 'ALTO')),
  es_pep BOOLEAN NOT NULL,
  es_pais_gafi BOOLEAN NOT NULL,
  monto_rango VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lista_restrictiva (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS verificacion_lista (
  id BIGSERIAL PRIMARY KEY,
  evaluacion_id BIGINT NOT NULL REFERENCES evaluacion_riesgo(id),
  lista_id BIGINT NOT NULL REFERENCES lista_restrictiva(id),
  resultado_declarado BOOLEAN NOT NULL,
  verificado_por BIGINT NOT NULL REFERENCES usuario(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (evaluacion_id, lista_id)
);

CREATE TABLE IF NOT EXISTS documento_requerido (
  id BIGSERIAL PRIMARY KEY,
  formulario_id BIGINT NOT NULL REFERENCES formulario_evaluacion(id),
  tipo_documento VARCHAR(80) NOT NULL,
  ruta_almacenamiento TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerta (
  id BIGSERIAL PRIMARY KEY,
  evaluacion_id BIGINT NOT NULL REFERENCES evaluacion_riesgo(id),
  tipo VARCHAR(50) NOT NULL,
  nivel VARCHAR(20) NOT NULL,
  dirigida_a_rol VARCHAR(40) NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria_log (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuario(id),
  rol VARCHAR(40) NOT NULL,
  accion VARCHAR(100) NOT NULL,
  recurso_tipo VARCHAR(80) NOT NULL,
  recurso_id BIGINT,
  resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('exito', 'fallo')),
  ip_address VARCHAR(45),
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formulario_proveedor ON formulario_evaluacion(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_evaluacion_formulario ON evaluacion_riesgo(formulario_id);
CREATE INDEX IF NOT EXISTS idx_documento_formulario ON documento_requerido(formulario_id);
CREATE INDEX IF NOT EXISTS idx_alerta_rol ON alerta(dirigida_a_rol, leida);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_log(usuario_id, timestamp_utc DESC);

-- A. Schema reconciliation (runs BEFORE seeding): bring a drifted production
-- DB in line with the current schema. Idempotent; also safe on fresh DBs.
ALTER TABLE auditoria_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_rol_check;
ALTER TABLE usuario ADD CONSTRAINT usuario_rol_check
  CHECK (rol IN ('proveedor', 'analista', 'oficial_cumplimiento', 'administrador', 'sistema'));

INSERT INTO lista_restrictiva (nombre, tipo, descripcion)
VALUES
  ('OFAC', 'sanciones', 'Oficina de Control de Activos Extranjeros'),
  ('ONU', 'sanciones', 'Consejo de Seguridad de Naciones Unidas'),
  ('INTERPOL', 'investigacion', 'Base de personas buscadas y alertas internacionales'),
  ('PANAMACOMPRA_INHABILITADOS', 'inhabilitados', 'Registro de inhabilitados de contrataciones publicas')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO usuario (id, nombre, email, password_hash, rol)
OVERRIDING SYSTEM VALUE
VALUES
  (0, 'Sistema SERP', 'sistema@serp.local', '$2b$10$afp518yOyopmyV9LnBsvQ.3y4M47Yp95ouBC1q0jRUUpnNlfwlMg6', 'sistema')
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuario (nombre, email, password_hash, rol)
VALUES
  ('Proveedor Demo', 'proveedor@serp.local', '$2b$10$IDLjoHJFBJibnOUcopXncOrn1uhcEKBtdNRmFHIw7b7oWW2XWQ/sW', 'proveedor'),
  ('Admin SERP', 'admin@serp.local', '$2b$10$tigyNK4V475OqZ1fENgaU.L3X9R5rjdJsaHpaLTffGHAjU1BmcNmG', 'administrador'),
  ('Analista SERP', 'analista@serp.local', '$2b$10$Y11qQEbW5bK7KQAtr8F4UO00BS0pPxQB.zCJR2AJja2kVo/XfnytK', 'analista'),
  ('Oficial Cumplimiento', 'oficial@serp.local', '$2b$10$bOpqJ9pWhlFodwbxY/2KzuE.XfNvGpTa9p8vaI0hk.UCI6jXuOoaK', 'oficial_cumplimiento')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_formulario_updated_at ON formulario_evaluacion;
CREATE TRIGGER trg_formulario_updated_at
BEFORE UPDATE ON formulario_evaluacion
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
