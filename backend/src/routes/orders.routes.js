import { Router } from 'express';
import { query, withTransaction } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, HttpError, ROLES, toInt } from '../utils/http.js';
import { getCartId } from './cart.routes.js';

const router = Router();
const STAFF = [ROLES.ADMIN, ROLES.EMPLEADO];
const ESTADOS = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

router.use(authenticate);

async function orderWithItems(id) {
  const { rows } = await query(
    `SELECT pe.*, u.nombre AS cliente, u.correo AS correo_cliente
       FROM Pedido pe JOIN Usuario u ON u.id_usuario = pe.id_usuario WHERE pe.id_pedido = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const items = await query(
    `SELECT dp.*, p.nombre, p.imagen_url FROM DetallePedido dp
       JOIN Producto p ON p.id_producto = dp.id_producto WHERE dp.id_pedido = $1`,
    [id]
  );
  return { ...rows[0], items: items.rows };
}

/**
 * POST /api/orders { direccion_envio } (Cliente)
 * Convierte el carrito en pedido. Dentro de una transacción:
 *  1. bloquea las filas de producto (FOR UPDATE) para evitar sobreventa,
 *  2. valida stock y estado activo de cada producto,
 *  3. descuenta inventario, crea Pedido + DetallePedido y vacía el carrito.
 */
router.post('/', authorize(ROLES.CLIENTE), asyncHandler(async (req, res) => {
  const direccion = req.body.direccion_envio?.trim();
  if (!direccion) throw new HttpError(400, 'La dirección de envío es obligatoria');

  const pedidoId = await withTransaction(async (client) => {
    const cartId = await getCartId(req.user.id_usuario, client);
    const { rows: items } = await client.query(
      `SELECT dc.id_producto, dc.cantidad, p.nombre, p.precio, p.stock, p.activo
         FROM DetalleCarrito dc JOIN Producto p ON p.id_producto = dc.id_producto
        WHERE dc.id_carrito = $1 ORDER BY dc.id_producto
        FOR UPDATE OF p`,
      [cartId]
    );
    if (!items.length) throw new HttpError(400, 'El carrito está vacío');

    const sinStock = items
      .filter((i) => !i.activo || i.cantidad > i.stock)
      .map((i) => ({ id_producto: i.id_producto, nombre: i.nombre, solicitado: i.cantidad, disponible: i.activo ? i.stock : 0 }));
    if (sinStock.length) throw new HttpError(409, 'Stock insuficiente para algunos productos', sinStock);

    const total = items.reduce((s, i) => s + i.cantidad * i.precio, 0);
    const { rows: [pedido] } = await client.query(
      'INSERT INTO Pedido (id_usuario, total, direccion_envio) VALUES ($1, $2, $3) RETURNING id_pedido',
      [req.user.id_usuario, total, direccion]
    );
    for (const i of items) {
      await client.query(
        'INSERT INTO DetallePedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
        [pedido.id_pedido, i.id_producto, i.cantidad, i.precio]
      );
      await client.query('UPDATE Producto SET stock = stock - $1 WHERE id_producto = $2', [i.cantidad, i.id_producto]);
    }
    await client.query('DELETE FROM DetalleCarrito WHERE id_carrito = $1', [cartId]);
    return pedido.id_pedido;
  });

  res.status(201).json(await orderWithItems(pedidoId));
}));

/** GET /api/orders/mis-pedidos (Cliente) */
router.get('/mis-pedidos', asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM Pedido WHERE id_usuario = $1 ORDER BY fecha_pedido DESC', [req.user.id_usuario]);
  res.json(rows);
}));

/** GET /api/orders?estado= (Administrador y Empleado) */
router.get('/', authorize(...STAFF), asyncHandler(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.estado) { params.push(req.query.estado); where = 'WHERE pe.estado = $1'; }
  const { rows } = await query(
    `SELECT pe.*, u.nombre AS cliente, u.correo AS correo_cliente,
            (SELECT COALESCE(SUM(cantidad),0) FROM DetallePedido d WHERE d.id_pedido = pe.id_pedido)::int AS unidades
       FROM Pedido pe JOIN Usuario u ON u.id_usuario = pe.id_usuario ${where}
      ORDER BY pe.fecha_pedido DESC`,
    params
  );
  res.json(rows);
}));

/** GET /api/orders/:id → dueño del pedido o staff */
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await orderWithItems(toInt(req.params.id));
  if (!order) throw new HttpError(404, 'Pedido no encontrado');
  if (order.id_usuario !== req.user.id_usuario && !STAFF.includes(req.user.rol)) {
    throw new HttpError(404, 'Pedido no encontrado');
  }
  res.json(order);
}));

/** PATCH /api/orders/:id/estado { estado } (Administrador). Si se cancela, repone stock. */
router.patch('/:id/estado', authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const { estado } = req.body;
  if (!ESTADOS.includes(estado)) throw new HttpError(400, `Estado inválido. Use: ${ESTADOS.join(', ')}`);

  await withTransaction(async (client) => {
    const { rows } = await client.query('SELECT estado FROM Pedido WHERE id_pedido = $1 FOR UPDATE', [id]);
    if (!rows[0]) throw new HttpError(404, 'Pedido no encontrado');
    const anterior = rows[0].estado;
    if (anterior === 'cancelado' && estado !== 'cancelado') throw new HttpError(400, 'Un pedido cancelado no puede reactivarse');
    if (estado === 'cancelado' && anterior !== 'cancelado') {
      await client.query(
        `UPDATE Producto p SET stock = p.stock + d.cantidad
           FROM DetallePedido d WHERE d.id_pedido = $1 AND d.id_producto = p.id_producto`,
        [id]
      );
    }
    await client.query('UPDATE Pedido SET estado = $1 WHERE id_pedido = $2', [estado, id]);
  });
  res.json(await orderWithItems(id));
}));

export default router;
