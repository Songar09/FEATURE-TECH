export function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Violaciones de restricciones de PostgreSQL
  if (err.code === '23505') return res.status(409).json({ error: 'El registro ya existe (valor duplicado)' });
  if (err.code === '23503') return res.status(409).json({ error: 'El registro está referenciado por otros datos' });
  if (err.code === '23514' || err.code === '22P02') return res.status(400).json({ error: 'Datos inválidos' });

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message,
    ...(err.details ? { detalles: err.details } : {}),
  });
}
