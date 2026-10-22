import jwt from 'jsonwebtoken';

export function signToken(user) {
  return jwt.sign({ sub: user.id_usuario, rol: user.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

/** Elimina campos sensibles antes de enviar el usuario al cliente. */
export function publicUser(u) {
  if (!u) return null;
  const { contrasena_hash, google_id, ...rest } = u;
  return { ...rest, tiene_google: Boolean(google_id), tiene_contrasena: Boolean(contrasena_hash) };
}
