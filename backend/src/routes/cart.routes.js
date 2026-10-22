import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, HttpError, ROLES, toInt } from '../utils/http.js';

const router = Router();
router.use(authenticate, authorize(ROLES.CLIENTE));

/** Obtiene (o crea) el carrito del usuario */
export async function getCartId(userId, db = { query }) {
  const { rows } = await db.query(
    `INSERT INTO Carrito (id_usuario) VALUES ($1)
     ON CONFLICT (id_usuario) DO UPDATE SET id_usuario = EXCLUDED.id_usuario
     RETURNING id_carrito`,
    [userId]
  );
  return rows[0].id_carrito;
}

async function cartPayload(cartId) {
  const { rows } = await query(
    `SELECT dc.id_producto, dc.cantidad, p.nombre, p.precio, p.imagen_url, p.stock, p.activo,
            (dc.cantidad * p.precio) AS subtotal
       FROM DetalleCarrito dc JOIN Producto p ON p.id_producto = dc.id_producto
      WHERE dc.id_carrito = $1 ORDER BY p.nombre`,
    [cartId]
  );
  const items = rows.map((r) => ({ ...r, subtotal: Number(r.subtotal) }));
  return {
    id_carrito: cartId,
    items,
    total: items.reduce((s, i) => s + i.subtotal, 0),
    cantidad_total: items.reduce((s, i) => s + i.cantidad, 0),
  };
}

async function assertAvailable(idProducto, cantidad) {
  const { rows } = await query('SELECT stock, activo, nombre FROM Producto WHERE id_producto = $1', [idProducto]);
  const p = rows[0];
  if (!p || !p.activo) throw new HttpError(404, 'Producto no disponible');
  if (cantidad > p.stock) throw new HttpError(409, `Solo hay ${p.stock} unidad(es) disponibles de ${p.nombre}`);
}

const parseQty = (v) => {
  const n = toInt(v);
  if (Number.isNaN(n) || n < 1) throw new HttpError(400, 'Cantidad inválida');
  return n;
};

router.get('/', asyncHandler(async (req, res) => {
  res.json(await cartPayload(await getCartId(req.user.id_usuario)));
}));

/** POST /api/cart/items { id_producto, cantidad } → agrega (suma si ya existe) */
router.post('/items', asyncHandler(async (req, res) => {
  const idProducto = toInt(req.body.id_producto);
  const cantidad = parseQty(req.body.cantidad ?? 1);
  const cartId = await getCartId(req.user.id_usuario);
  const current = await query('SELECT cantidad FROM DetalleCarrito WHERE id_carrito = $1 AND id_producto = $2', [cartId, idProducto]);
  await assertAvailable(idProducto, (current.rows[0]?.cantidad || 0) + cantidad);
  await query(
    `INSERT INTO DetalleCarrito (id_carrito, id_producto, cantidad) VALUES ($1, $2, $3)
     ON CONFLICT (id_carrito, id_producto) DO UPDATE SET cantidad = DetalleCarrito.cantidad + EXCLUDED.cantidad`,
    [cartId, idProducto, cantidad]
  );
  res.status(201).json(await cartPayload(cartId));
}));

/** PUT /api/cart/items/:idProducto { cantidad } → modifica cantidad */
router.put('/items/:idProducto', asyncHandler(async (req, res) => {
  const idProducto = toInt(req.params.idProducto);
  const cantidad = parseQty(req.body.cantidad);
  const cartId = await getCartId(req.user.id_usuario);
  await assertAvailable(idProducto, cantidad);
  const r = await query('UPDATE DetalleCarrito SET cantidad = $1 WHERE id_carrito = $2 AND id_producto = $3', [cantidad, cartId, idProducto]);
  if (!r.rowCount) throw new HttpError(404, 'El producto no está en el carrito');
  res.json(await cartPayload(cartId));
}));

/** DELETE /api/cart/items/:idProducto → retira producto */
router.delete('/items/:idProducto', asyncHandler(async (req, res) => {
  const cartId = await getCartId(req.user.id_usuario);
  await query('DELETE FROM DetalleCarrito WHERE id_carrito = $1 AND id_producto = $2', [cartId, toInt(req.params.idProducto)]);
  res.json(await cartPayload(cartId));
}));

/** DELETE /api/cart → vacía el carrito */
router.delete('/', asyncHandler(async (req, res) => {
  const cartId = await getCartId(req.user.id_usuario);
  await query('DELETE FROM DetalleCarrito WHERE id_carrito = $1', [cartId]);
  res.json(await cartPayload(cartId));
}));

export default router;
