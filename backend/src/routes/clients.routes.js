import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, HttpError, ROLES, toInt } from '../utils/http.js';

const router = Router();

// Registro de clientes: lectura para Administrador y Empleado
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.EMPLEADO));

// Método de registro derivado de las credenciales guardadas
const METODO = `CASE
    WHEN u.google_id IS NOT NULL AND u.contrasena_hash IS NOT NULL THEN 'Correo + Google'
    WHEN u.google_id IS NOT NULL THEN 'Google'
    ELSE 'Correo'
  END`;

// Los pedidos cancelados no suman al total comprado
const RESUMEN = `
  SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.direccion, u.avatar_url, u.estado,
         u.fecha_registro, ${METODO} AS metodo_registro,
         COUNT(p.id_pedido)::int AS pedidos,
         COALESCE(SUM(p.total) FILTER (WHERE p.estado <> 'cancelado'), 0)::float AS total_comprado,
         MAX(p.fecha_pedido) AS ultimo_pedido
  FROM Usuario u
  LEFT JOIN Pedido p ON p.id_usuario = u.id_usuario
  WHERE u.rol = 'Cliente'`;

/** GET /api/clients?q=&compras=con|sin */
router.get('/', asyncHandler(async (req, res) => {
  const { q, compras } = req.query;
  const params = [];
  let where = '';
  if (q) { params.push(`%${q}%`); where = ` AND (u.nombre ILIKE $1 OR u.correo ILIKE $1 OR u.telefono ILIKE $1)`; }
  const having = compras === 'con' ? 'HAVING COUNT(p.id_pedido) > 0'
    : compras === 'sin' ? 'HAVING COUNT(p.id_pedido) = 0' : '';
  const { rows } = await query(
    `${RESUMEN}${where} GROUP BY u.id_usuario ${having} ORDER BY u.fecha_registro DESC`,
    params
  );
  res.json(rows);
}));

/** GET /api/clients/:id → datos del cliente y su historial de pedidos */
router.get('/:id', asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  if (Number.isNaN(id)) throw new HttpError(400, 'Id inválido');
  const { rows } = await query(`${RESUMEN} AND u.id_usuario = $1 GROUP BY u.id_usuario`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Cliente no encontrado');
  const pedidos = await query(
    `SELECT p.id_pedido, p.fecha_pedido, p.estado, p.total,
            COALESCE(SUM(d.cantidad), 0)::int AS unidades
     FROM Pedido p LEFT JOIN DetallePedido d ON d.id_pedido = p.id_pedido
     WHERE p.id_usuario = $1 GROUP BY p.id_pedido ORDER BY p.fecha_pedido DESC`,
    [id]
  );
  res.json({ ...rows[0], historial: pedidos.rows });
}));

export default router;
