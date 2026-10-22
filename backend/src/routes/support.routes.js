import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, HttpError, ROLES, toInt } from '../utils/http.js';

const router = Router();
const STAFF = [ROLES.ADMIN, ROLES.EMPLEADO];
router.use(authenticate);

/** POST /api/support { asunto, mensaje, id_pedido? } (Cliente) */
router.post('/', authorize(ROLES.CLIENTE), asyncHandler(async (req, res) => {
  const { asunto, mensaje, id_pedido } = req.body;
  if (!asunto?.trim() || !mensaje?.trim()) throw new HttpError(400, 'Asunto y mensaje son obligatorios');

  let pedido = null;
  if (id_pedido) {
    pedido = toInt(id_pedido);
    const own = await query('SELECT 1 FROM Pedido WHERE id_pedido = $1 AND id_usuario = $2', [pedido, req.user.id_usuario]);
    if (!own.rowCount) throw new HttpError(400, 'El pedido indicado no pertenece a tu cuenta');
  }
  const { rows } = await query(
    'INSERT INTO Soporte (id_usuario, id_pedido, asunto, mensaje) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.user.id_usuario, pedido, asunto.trim(), mensaje.trim()]
  );
  res.status(201).json(rows[0]);
}));

/** GET /api/support/mios (Cliente) */
router.get('/mios', asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM Soporte WHERE id_usuario = $1 ORDER BY fecha_creacion DESC', [req.user.id_usuario]);
  res.json(rows);
}));

/** GET /api/support?estado= (Administrador y Empleado) */
router.get('/', authorize(...STAFF), asyncHandler(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.estado) { params.push(req.query.estado); where = 'WHERE s.estado = $1'; }
  const { rows } = await query(
    `SELECT s.*, u.nombre AS cliente, u.correo AS correo_cliente, e.nombre AS empleado
       FROM Soporte s JOIN Usuario u ON u.id_usuario = s.id_usuario
       LEFT JOIN Usuario e ON e.id_usuario = s.id_empleado ${where}
      ORDER BY (s.estado = 'cerrado'), s.fecha_creacion DESC`,
    params
  );
  res.json(rows);
}));

/** PATCH /api/support/:id/responder { respuesta, cerrar? } (Administrador y Empleado) */
router.patch('/:id/responder', authorize(...STAFF), asyncHandler(async (req, res) => {
  const { respuesta, cerrar } = req.body;
  if (!respuesta?.trim()) throw new HttpError(400, 'La respuesta es obligatoria');
  const { rows } = await query(
    `UPDATE Soporte SET respuesta = $1, id_empleado = $2, fecha_respuesta = NOW(),
            estado = $3::estado_soporte
      WHERE id_soporte = $4 RETURNING *`,
    [respuesta.trim(), req.user.id_usuario, cerrar ? 'cerrado' : 'en_proceso', toInt(req.params.id)]
  );
  if (!rows[0]) throw new HttpError(404, 'Solicitud no encontrada');
  res.json(rows[0]);
}));

/** PATCH /api/support/:id/cerrar (Administrador y Empleado) */
router.patch('/:id/cerrar', authorize(...STAFF), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE Soporte SET estado = 'cerrado', id_empleado = COALESCE(id_empleado, $1)
      WHERE id_soporte = $2 RETURNING *`,
    [req.user.id_usuario, toInt(req.params.id)]
  );
  if (!rows[0]) throw new HttpError(404, 'Solicitud no encontrada');
  res.json(rows[0]);
}));

export default router;
