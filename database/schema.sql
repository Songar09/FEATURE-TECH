-- =====================================================================
--  FEATURE TECH - Esquema relacional (PostgreSQL 14+)
--  Ejecutar:  psql -U postgres -f database/schema.sql
-- =====================================================================

-- 1) Crear la base de datos (ejecutar conectado a "postgres").
--    Si ya existe, comente estas dos líneas.
DROP DATABASE IF EXISTS feature_tech;
CREATE DATABASE feature_tech WITH ENCODING 'UTF8';

\connect feature_tech

-- 2) Tipos enumerados
CREATE TYPE rol_usuario    AS ENUM ('Administrador', 'Empleado', 'Cliente');
CREATE TYPE estado_usuario AS ENUM ('activo', 'suspendido');
CREATE TYPE estado_pedido  AS ENUM ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado');
CREATE TYPE estado_soporte AS ENUM ('abierto', 'en_proceso', 'cerrado');

-- 3) Tablas
CREATE TABLE Usuario (
    id_usuario      SERIAL PRIMARY KEY,
    nombre          VARCHAR(120)  NOT NULL,
    correo          VARCHAR(160)  NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255),                     -- NULL si solo usa Google
    google_id       VARCHAR(80)   UNIQUE,
    avatar_url      TEXT,
    telefono        VARCHAR(30),
    direccion       TEXT,
    rol             rol_usuario    NOT NULL DEFAULT 'Cliente',
    estado          estado_usuario NOT NULL DEFAULT 'activo',
    fecha_registro  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_metodo_login CHECK (contrasena_hash IS NOT NULL OR google_id IS NOT NULL)
);

CREATE TABLE Producto (
    id_producto     SERIAL PRIMARY KEY,
    nombre          VARCHAR(160)  NOT NULL,
    descripcion     TEXT,
    categoria       VARCHAR(80)   NOT NULL,
    marca           VARCHAR(80),
    precio          NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    stock           INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo    INTEGER       NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    imagen_url      TEXT,
    activo          BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE Carrito (
    id_carrito      SERIAL PRIMARY KEY,
    id_usuario      INTEGER NOT NULL UNIQUE REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE DetalleCarrito (
    id_detalle_carrito SERIAL PRIMARY KEY,
    id_carrito      INTEGER NOT NULL REFERENCES Carrito(id_carrito) ON DELETE CASCADE,
    id_producto     INTEGER NOT NULL REFERENCES Producto(id_producto) ON DELETE CASCADE,
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    CONSTRAINT uq_carrito_producto UNIQUE (id_carrito, id_producto)
);

CREATE TABLE Pedido (
    id_pedido       SERIAL PRIMARY KEY,
    id_usuario      INTEGER NOT NULL REFERENCES Usuario(id_usuario) ON DELETE RESTRICT,
    total           NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    estado          estado_pedido NOT NULL DEFAULT 'pendiente',
    direccion_envio TEXT NOT NULL,
    nombre_contacto   VARCHAR(120),
    telefono_contacto VARCHAR(30),
    ciudad_envio      VARCHAR(80),
    metodo_pago       VARCHAR(30),
    referencia_pago   VARCHAR(60),
    tarjeta_ultimos4  CHAR(4),
    fecha_pedido    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE DetallePedido (
    id_detalle_pedido SERIAL PRIMARY KEY,
    id_pedido       INTEGER NOT NULL REFERENCES Pedido(id_pedido) ON DELETE CASCADE,
    id_producto     INTEGER NOT NULL REFERENCES Producto(id_producto) ON DELETE RESTRICT,
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

CREATE TABLE Soporte (
    id_soporte      SERIAL PRIMARY KEY,
    id_usuario      INTEGER NOT NULL REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    id_pedido       INTEGER REFERENCES Pedido(id_pedido) ON DELETE SET NULL,
    asunto          VARCHAR(160) NOT NULL,
    mensaje         TEXT NOT NULL,
    respuesta       TEXT,
    id_empleado     INTEGER REFERENCES Usuario(id_usuario) ON DELETE SET NULL,
    estado          estado_soporte NOT NULL DEFAULT 'abierto',
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_respuesta TIMESTAMPTZ
);

-- 4) Índices
CREATE INDEX idx_producto_categoria ON Producto(categoria);
CREATE INDEX idx_producto_activo    ON Producto(activo);
CREATE INDEX idx_pedido_usuario     ON Pedido(id_usuario);
CREATE INDEX idx_pedido_estado      ON Pedido(estado);
CREATE INDEX idx_soporte_estado     ON Soporte(estado);

-- 5) Trigger genérico para fecha_actualizacion
CREATE OR REPLACE FUNCTION fn_actualizar_fecha() RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuario_upd  BEFORE UPDATE ON Usuario  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();
CREATE TRIGGER trg_producto_upd BEFORE UPDATE ON Producto FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();
CREATE TRIGGER trg_carrito_upd  BEFORE UPDATE ON Carrito  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();
CREATE TRIGGER trg_pedido_upd   BEFORE UPDATE ON Pedido   FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();
