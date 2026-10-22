import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { HttpError } from '../utils/http.js';

async function resolveUser(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Token inválido o expirado');
  }

  // Se consulta la BD en cada petición para que un cambio de rol o una
  // suspensión tengan efecto inmediato aunque el token siga vigente.
  const { rows } = await query(
    'SELECT id_usuario, nombre, correo, rol, estado, avatar_url FROM Usuario WHERE id_usuario = $1',
    [payload.sub]
  );
  const user = rows[0];
  if (!user) throw new HttpError(401, 'Usuario no encontrado');
  if (user.estado === 'suspendido') throw new HttpError(403, 'Tu cuenta está suspendida');
  return user;
}

/** Exige un JWT válido. Deja el usuario en req.user. */
export async function authenticate(req, _res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) throw new HttpError(401, 'Autenticación requerida');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Si hay token lo valida; si no, continúa como invitado. */
export async function optionalAuth(req, _res, next) {
  try {
    req.user = await resolveUser(req);
    next();
  } catch {
    req.user = null;
    next();
  }
}

/** Middleware de validación de roles: authorize('Administrador', 'Empleado') */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Autenticación requerida'));
  if (!roles.includes(req.user.rol)) {
    return next(new HttpError(403, `Acceso denegado. Requiere rol: ${roles.join(' o ')}`));
  }
  next();
};
