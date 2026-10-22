import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, HttpError, isEmail, ROLES, toInt } from '../utils/http.js';
import { publicUser } from '../utils/auth.js';

const router = Router();
const VALID_ROLES = Object.values(ROLES);
const VALID_STATES = ['activo', 'suspendido'];

// Todo el módulo es exclusivo del Administrador
router.use(authenticate, authorize(ROLES.ADMIN));

const getId = (req) => {
  const id = toInt(req.params.id);
  if (Number.isNaN(id)) throw new HttpError(400, 'Id inválido');
  return id;
};
const forbidSelf = (req, id, accion) => {
  if (id === req.user.id_usuario) throw new HttpError(400, `No puedes ${accion} tu propia cuenta`);
};

/** GET /api/users?q=&rol=&estado= */
router.get('/', asyncHandler(async (req, res) => {
  const { q, rol, estado } = req.query;
  const where = [];
  const params = [];
  if (q) { params.push(`%${q}%`); where.push(`(nombre ILIKE $${params.length} OR correo ILIKE $${params.length})`); }
  if (rol) { params.push(rol); where.push(`rol = $${params.length}`); }
  if (estado) { params.push(estado); where.push(`estado = $${params.length}`); }
  const { rows } = await query(
    `SELECT * FROM Usuario ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY fecha_registro DESC`,
    params
  );
  res.json(rows.map(publicUser));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM Usuario WHERE id_usuario = $1', [getId(req)]);
  if (!rows[0]) throw new HttpError(404, 'Usuario no encontrado');
  res.json(publicUser(rows[0]));
}));

/** POST /api/users → el Administrador crea usuarios manualmente con cualquier rol */
router.post('/', asyncHandler(async (req, res) => {
  const { nombre, correo, contrasena, rol = ROLES.CLIENTE, telefono, direccion } = req.body;
  if (!nombre?.trim()) throw new HttpError(400, 'El nombre es obligatorio');
  if (!isEmail(correo)) throw new HttpError(400, 'Correo inválido');
  if (typeof contrasena !== 'string' || contrasena.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
  if (!VALID_ROLES.includes(rol)) throw new HttpError(400, 'Rol inválido');

  const hash = await bcrypt.hash(contrasena, 12);
  const { rows } = await query(
    `INSERT INTO Usuario (nombre, correo, contrasena_hash, rol, telefono, direccion)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nombre.trim(), correo.toLowerCase().trim(), hash, rol, telefono || null, direccion || null]
  );
  res.status(201).json(publicUser(rows[0]));
}));

/** PUT /api/users/:id → editar información (y opcionalmente rol/estado/contraseña) */
router.put('/:id', asyncHandler(async (req, res) => {
  const id = getId(req);
  const { nombre, correo, telefono, direccion, rol, estado, contrasena } = req.body;
  if (correo !== undefined && !isEmail(correo)) throw new HttpError(400, 'Correo inválido');
  if (rol !== undefined && !VALID_ROLES.includes(rol)) throw new HttpError(400, 'Rol inválido');
  if (estado !== undefined && !VALID_STATES.includes(estado)) throw new HttpError(400, 'Estado inválido');
  if (id === req.user.id_usuario && ((rol && rol !== ROLES.ADMIN) || estado === 'suspendido')) {
    throw new HttpError(400, 'No puedes quitarte el rol de Administrador ni suspender tu propia cuenta');
  }
  let hash;
  if (contrasena) {
    if (contrasena.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
    hash = await bcrypt.hash(contrasena, 12);
  }

  const { rows } = await query(
    `UPDATE Usuario SET
       nombre = COALESCE($1, nombre),
       correo = COALESCE($2, correo),
       telefono = COALESCE($3, telefono),
       direccion = COALESCE($4, direccion),
       rol = COALESCE($5::rol_usuario, rol),
       estado = COALESCE($6::estado_usuario, estado),
       contrasena_hash = COALESCE($7, contrasena_hash)
     WHERE id_usuario = $8 RETURNING *`,
    [nombre?.trim() || null, correo?.toLowerCase().trim() || null, telefono ?? null, direccion ?? null,
     rol || null, estado || null, hash || null, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Usuario no encontrado');
  res.json(publicUser(rows[0]));
}));

/** PATCH /api/users/:id/rol  { rol: "Empleado" } → ascender / cambiar rol */
router.patch('/:id/rol', asyncHandler(async (req, res) => {
  const id = getId(req);
  const { rol } = req.body;
  if (!VALID_ROLES.includes(rol)) throw new HttpError(400, 'Rol inválido');
  forbidSelf(req, id, 'cambiar el rol de');
  const { rows } = await query('UPDATE Usuario SET rol = $1 WHERE id_usuario = $2 RETURNING *', [rol, id]);
  if (!rows[0]) throw new HttpError(404, 'Usuario no encontrado');
  res.json(publicUser(rows[0]));
}));

/** PATCH /api/users/:id/estado  { estado: "suspendido" | "activo" } */
router.patch('/:id/estado', asyncHandler(async (req, res) => {
  const id = getId(req);
  const { estado } = req.body;
  if (!VALID_STATES.includes(estado)) throw new HttpError(400, 'Estado inválido');
  forbidSelf(req, id, 'suspender');
  const { rows } = await query('UPDATE Usuario SET estado = $1 WHERE id_usuario = $2 RETURNING *', [estado, id]);
  if (!rows[0]) throw new HttpError(404, 'Usuario no encontrado');
  res.json(publicUser(rows[0]));
}));

/** DELETE /api/users/:id → si tiene pedidos, se sugiere suspender (FK RESTRICT) */
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = getId(req);
  forbidSelf(req, id, 'eliminar');
  const pedidos = await query('SELECT 1 FROM Pedido WHERE id_usuario = $1 LIMIT 1', [id]);
  if (pedidos.rowCount) {
    throw new HttpError(409, 'El usuario tiene pedidos registrados; suspende la cuenta en lugar de eliminarla');
  }
  const { rowCount } = await query('DELETE FROM Usuario WHERE id_usuario = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Usuario no encontrado');
  res.status(204).end();
}));

export default router;
