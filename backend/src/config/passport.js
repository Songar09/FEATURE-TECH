import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from './db.js';

export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Busca o crea el usuario de Google.
 * - Si ya existe por google_id → lo retorna.
 * - Si existe por correo (registro manual previo) → vincula la cuenta de Google.
 * - Si es nuevo → se crea SIEMPRE con rol "Cliente".
 */
async function findOrCreateGoogleUser(profile) {
  const correo = profile.emails?.[0]?.value?.toLowerCase();
  const avatar = profile.photos?.[0]?.value ?? null;
  if (!correo) throw new Error('La cuenta de Google no tiene un correo disponible');

  const byGoogle = await query('SELECT * FROM Usuario WHERE google_id = $1', [profile.id]);
  if (byGoogle.rows[0]) return byGoogle.rows[0];

  const byEmail = await query('SELECT * FROM Usuario WHERE correo = $1', [correo]);
  if (byEmail.rows[0]) {
    const { rows } = await query(
      `UPDATE Usuario SET google_id = $1, avatar_url = COALESCE(avatar_url, $2)
       WHERE id_usuario = $3 RETURNING *`,
      [profile.id, avatar, byEmail.rows[0].id_usuario]
    );
    return rows[0];
  }

  const { rows } = await query(
    `INSERT INTO Usuario (nombre, correo, google_id, avatar_url, rol)
     VALUES ($1, $2, $3, $4, 'Cliente') RETURNING *`,
    [profile.displayName || correo.split('@')[0], correo, profile.id, avatar]
  );
  return rows[0];
}

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          done(null, await findOrCreateGoogleUser(profile));
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth deshabilitado: defina GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env');
}

export default passport;
