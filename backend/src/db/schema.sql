CREATE TABLE IF NOT EXISTS usuario (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(140) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(40) NOT NULL CHECK (rol IN ('proveedor', 'analista', 'oficial_cumplimiento', 'administrador')),
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
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formulario_proveedor ON formulario_evaluacion(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_evaluacion_formulario ON evaluacion_riesgo(formulario_id);
CREATE INDEX IF NOT EXISTS idx_documento_formulario ON documento_requerido(formulario_id);
CREATE INDEX IF NOT EXISTS idx_alerta_rol ON alerta(dirigida_a_rol, leida);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_log(usuario_id, timestamp_utc DESC);

INSERT INTO lista_restrictiva (nombre, tipo, descripcion)
VALUES
  ('OFAC', 'sanciones', 'Oficina de Control de Activos Extranjeros'),
  ('ONU', 'sanciones', 'Consejo de Seguridad de Naciones Unidas'),
  ('INTERPOL', 'investigacion', 'Base de personas buscadas y alertas internacionales'),
  ('PANAMACOMPRA_INHABILITADOS', 'inhabilitados', 'Registro de inhabilitados de contrataciones publicas')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO usuario (nombre, email, password_hash, rol)
VALUES
  ('Proveedor Demo', 'proveedor@serp.local', 'proveedor123', 'proveedor'),
  ('Admin SERP', 'admin@serp.local', 'admin123', 'administrador'),
  ('Analista SERP', 'analista@serp.local', 'analista123', 'analista'),
  ('Oficial Cumplimiento', 'oficial@serp.local', 'oficial123', 'oficial_cumplimiento')
ON CONFLICT (email) DO NOTHING;
