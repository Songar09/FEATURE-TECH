export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Envuelve un handler async para enviar los errores al middleware de errores. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const ROLES = Object.freeze({
  ADMIN: 'Administrador',
  EMPLEADO: 'Empleado',
  CLIENTE: 'Cliente',
});

export const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const toInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};
