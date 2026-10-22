import { Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import passport, { googleEnabled } from '../config/passport.js';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError, isEmail } from '../utils/http.js';
import { publicUser, signToken } from '../utils/auth.js';

const router = Router();
const SALT_ROUNDS = 12;

// Limita intentos de login/registro para mitigar fuerza bruta
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

/** POST /api/auth/register  → registro manual; el rol es SIEMPRE "Cliente". */
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { nombre, correo, contrasena } = req.body;
  if (!nombre?.trim()) throw new HttpError(400, 'El nombre es obligatorio');
  if (!isEmail(correo)) throw new HttpError(400, 'Correo inválido');
  if (typeof contrasena !== 'string' || contrasena.length < 8) {
    throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
  }

  const email = correo.toLowerCase().trim();
  const exists = await query('SELECT 1 FROM Usuario WHERE correo = $1', [email]);
  if (exists.rowCount) throw new HttpError(409, 'Ya existe una cuenta con ese correo');

  const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
  // Cualquier "rol" enviado en el body se ignora deliberadamente.
  const { rows } = await query(
    `INSERT INTO Usuario (nombre, correo, contrasena_hash, rol)
     VALUES ($1, $2, $3, 'Cliente') RETURNING *`,
    [nombre.trim(), email, hash]
  );
  res.status(201).json({ token: signToken(rows[0]), usuario: publicUser(rows[0]) });
}));

/** POST /api/auth/login */
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { correo, contrasena } = req.body;
  if (!isEmail(correo) || !contrasena) throw new HttpError(400, 'Correo y contraseña son obligatorios');

  const { rows } = await query('SELECT * FROM Usuario WHERE correo = $1', [correo.toLowerCase().trim()]);
  const user = rows[0];
  const ok = user?.contrasena_hash && (await bcrypt.compare(contrasena, user.contrasena_hash));
  if (!ok) throw new HttpError(401, 'Credenciales incorrectas');
  if (user.estado === 'suspendido') throw new HttpError(403, 'Tu cuenta está suspendida. Contacta al administrador.');

  res.json({ token: signToken(user), usuario: publicUser(user) });
}));

/** GET /api/auth/me */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM Usuario WHERE id_usuario = $1', [req.user.id_usuario]);
  res.json({ usuario: publicUser(rows[0]) });
}));

/** GET /api/auth/google/status → permite al frontend saber si mostrar el botón */
router.get('/google/status', (_req, res) => res.json({ habilitado: googleEnabled }));

/** GET /api/auth/google → redirige a la pantalla de consentimiento de Google */
router.get('/google', (req, res, next) => {
  if (!googleEnabled) return next(new HttpError(503, 'Google OAuth no está configurado en el servidor'));
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account' })(req, res, next);
});

/** GET /api/auth/google/callback → Google vuelve aquí; emitimos JWT y regresamos al frontend */
router.get('/google/callback', (req, res, next) => {
  if (!googleEnabled) return next(new HttpError(503, 'Google OAuth no está configurado en el servidor'));
  const front = process.env.FRONTEND_URL;
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${front}/login?error=google`);
    if (user.estado === 'suspendido') return res.redirect(`${front}/login?error=suspendido`);
    // El token viaja en el fragmento (#) para que no quede en logs del servidor ni en el Referer
    res.redirect(`${front}/auth/callback#token=${encodeURIComponent(signToken(user))}`);
  })(req, res, next);
});

export default router;
