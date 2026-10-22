import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError, ROLES, toInt } from '../utils/http.js';

const router = Router();
const STAFF = [ROLES.ADMIN, ROLES.EMPLEADO];

/** Estado visual del stock que usa el frontend para las etiquetas */
export const stockStatus = (p) =>
  p.stock <= 0 ? 'agotado' : p.stock <= p.stock_minimo ? 'pocas_unidades' : 'en_stock';
const withStatus = (p) => ({ ...p, estado_stock: stockStatus(p) });

const getId = (req) => {
  const id = toInt(req.params.id);
  if (Number.isNaN(id)) throw new HttpError(400, 'Id inválido');
  return id;
};

/**
 * GET /api/products?q=&categoria=&orden=precio_asc|precio_desc|nombre&todos=1
 * Público: solo productos activos. Staff con ?todos=1 ve también los inactivos.
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q, categoria, orden, todos } = req.query;
  const isStaff = req.user && STAFF.includes(req.user.rol);
  const where = [];
  const params = [];
  if (!(isStaff && todos === '1')) where.push('activo = TRUE');
  if (q) { params.push(`%${q}%`); where.push(`(nombre ILIKE $${params.length} OR descripcion ILIKE $${params.length} OR marca ILIKE $${params.length})`); }
  if (categoria) { params.push(categoria); where.push(`categoria = $${params.length}`); }
  const orderBy = { precio_asc: 'precio ASC', precio_desc: 'precio DESC', nombre: 'nombre ASC' }[orden] || 'fecha_creacion DESC';

  const { rows } = await query(
    `SELECT * FROM Producto ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${orderBy}`,
    params
  );
  res.json(rows.map(withStatus));
}));

router.get('/categorias', asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT DISTINCT categoria FROM Producto WHERE activo = TRUE ORDER BY categoria');
  res.json(rows.map((r) => r.categoria));
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM Producto WHERE id_producto = $1', [getId(req)]);
  const p = rows[0];
  const isStaff = req.user && STAFF.includes(req.user.rol);
  if (!p || (!p.activo && !isStaff)) throw new HttpError(404, 'Producto no encontrado');
  res.json(withStatus(p));
}));

function validateProduct(body, partial = false) {
  const { nombre, categoria, precio, stock, stock_minimo } = body;
  if (!partial || nombre !== undefined) if (!nombre?.trim()) throw new HttpError(400, 'El nombre es obligatorio');
  if (!partial || categoria !== undefined) if (!categoria?.trim()) throw new HttpError(400, 'La categoría es obligatoria');
  if (!partial || precio !== undefined) if (!(Number(precio) >= 0)) throw new HttpError(400, 'Precio inválido');
  if (stock !== undefined && !(Number.isInteger(Number(stock)) && Number(stock) >= 0)) throw new HttpError(400, 'Stock inválido');
  if (stock_minimo !== undefined && !(Number.isInteger(Number(stock_minimo)) && Number(stock_minimo) >= 0)) throw new HttpError(400, 'Stock mínimo inválido');
}

/** POST /api/products (Administrador) */
router.post('/', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  validateProduct(req.body);
  const { nombre, descripcion, categoria, marca, precio, stock = 0, stock_minimo = 5, imagen_url, activo = true } = req.body;
  const { rows } = await query(
    `INSERT INTO Producto (nombre, descripcion, categoria, marca, precio, stock, stock_minimo, imagen_url, activo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [nombre.trim(), descripcion || null, categoria.trim(), marca || null, precio, stock, stock_minimo, imagen_url || null, Boolean(activo)]
  );
  res.status(201).json(withStatus(rows[0]));
}));

/** PUT /api/products/:id (Administrador) */
router.put('/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  validateProduct(req.body, true);
  const { nombre, descripcion, categoria, marca, precio, stock, stock_minimo, imagen_url, activo } = req.body;
  const { rows } = await query(
    `UPDATE Producto SET
       nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion),
       categoria = COALESCE($3, categoria), marca = COALESCE($4, marca),
       precio = COALESCE($5, precio), stock = COALESCE($6, stock),
       stock_minimo = COALESCE($7, stock_minimo), imagen_url = COALESCE($8, imagen_url),
       activo = COALESCE($9, activo)
     WHERE id_producto = $10 RETURNING *`,
    [nombre ?? null, descripcion ?? null, categoria ?? null, marca ?? null, precio ?? null, stock ?? null,
     stock_minimo ?? null, imagen_url ?? null, activo ?? null, getId(req)]
  );
  if (!rows[0]) throw new HttpError(404, 'Producto no encontrado');
  res.json(withStatus(rows[0]));
}));

/** PATCH /api/products/:id/activo { activo: boolean } (Administrador) */
router.patch('/:id/activo', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  if (typeof req.body.activo !== 'boolean') throw new HttpError(400, '"activo" debe ser booleano');
  const { rows } = await query('UPDATE Producto SET activo = $1 WHERE id_producto = $2 RETURNING *', [req.body.activo, getId(req)]);
  if (!rows[0]) throw new HttpError(404, 'Producto no encontrado');
  res.json(withStatus(rows[0]));
}));

/**
 * PATCH /api/products/:id/stock (Administrador y Empleado)
 * Body: { stock: 20 }  → fija el valor   |   { ajuste: -3 } → suma/resta
 */
router.patch('/:id/stock', authenticate, authorize(...STAFF), asyncHandler(async (req, res) => {
  const { stock, ajuste } = req.body;
  let sql, val;
  if (stock !== undefined) {
    val = toInt(stock);
    if (Number.isNaN(val) || val < 0) throw new HttpError(400, 'Stock inválido');
    sql = 'UPDATE Producto SET stock = $1 WHERE id_producto = $2 RETURNING *';
  } else if (ajuste !== undefined) {
    val = toInt(ajuste);
    if (Number.isNaN(val)) throw new HttpError(400, 'Ajuste inválido');
    sql = 'UPDATE Producto SET stock = stock + $1 WHERE id_producto = $2 AND stock + $1 >= 0 RETURNING *';
  } else {
    throw new HttpError(400, 'Envía "stock" o "ajuste"');
  }
  const { rows } = await query(sql, [val, getId(req)]);
  if (!rows[0]) throw new HttpError(400, 'Producto no encontrado o el ajuste dejaría el stock negativo');
  res.json(withStatus(rows[0]));
}));

export default router;
