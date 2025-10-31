-- Crear base de datos
CREATE DATABASE lab_inscripciones;

-- Conectar a la base de datos
\c lab_inscripciones;

-- Tabla de configuración del administrador
CREATE TABLE configuracion_admin (
    id SERIAL PRIMARY KEY,
    codigo_acceso VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar código de acceso por defecto (1234) - Hash con bcrypt
-- Debes cambiar esto en producción ejecutando:
-- UPDATE configuracion_admin SET codigo_acceso = '$2a$10$[tu_hash_aqui]' WHERE id = 1;
INSERT INTO configuracion_admin (codigo_acceso) 
VALUES ('$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa'); -- Hash de "1234"

-- Tabla de inscripciones
CREATE TABLE inscripciones (
    id SERIAL PRIMARY KEY,
    nombre_apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    anio_cursa VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    codigo_inscripcion VARCHAR(10) UNIQUE NOT NULL,
    es_profesor BOOLEAN DEFAULT FALSE,
    inscripcion_padre_id INTEGER REFERENCES inscripciones(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_anio_cursa CHECK (anio_cursa IN ('1º año', '2º año', '3º año', 'Finalizó'))
);

-- Tabla de profesores (emails que activan reserva completa)
CREATE TABLE profesores_reservas (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de fechas bloqueadas
CREATE TABLE fechas_bloqueadas (
    id SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_inscripciones_fecha ON inscripciones(fecha);
CREATE INDEX idx_inscripciones_codigo ON inscripciones(codigo_inscripcion);
CREATE INDEX idx_inscripciones_email ON inscripciones(email);
CREATE INDEX idx_profesores_email ON profesores_reservas(email);
CREATE INDEX idx_fechas_bloqueadas_fecha ON fechas_bloqueadas(fecha);

-- Insertar algunos profesores de ejemplo (opcional)
INSERT INTO profesores_reservas (email) VALUES 
('profesor1@example.com'),
('profesor2@example.com');

-- Comentarios para documentación
COMMENT ON TABLE inscripciones IS 'Tabla principal de inscripciones a laboratorios';
COMMENT ON TABLE profesores_reservas IS 'Lista de emails de profesores que reservan todos los cupos';
COMMENT ON TABLE fechas_bloqueadas IS 'Fechas que no están disponibles para inscripción';
COMMENT ON COLUMN inscripciones.inscripcion_padre_id IS 'ID de la inscripción principal cuando es una reserva de profesor';
COMMENT ON COLUMN inscripciones.es_profesor IS 'Indica si la inscripción corresponde a un profesor';