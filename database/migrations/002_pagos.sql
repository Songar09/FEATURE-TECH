-- Datos de contacto/envío y pago en Pedido. Es idempotente: se puede ejecutar varias veces.
ALTER TABLE Pedido ADD COLUMN IF NOT EXISTS nombre_contacto   VARCHAR(120);
ALTER TABLE Pedido ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(30);
ALTER TABLE Pedido ADD COLUMN IF NOT EXISTS ciudad_envio      VARCHAR(80);
ALTER TABLE Pedido ADD COLUMN IF NOT EXISTS metodo_pago       VARCHAR(30);
ALTER TABLE Pedido ADD COLUMN IF NOT EXISTS referencia_pago   VARCHAR(60);
ALTER TABLE Pedido ADD COLUMN IF NOT EXISTS tarjeta_ultimos4  CHAR(4);
