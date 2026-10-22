import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  console.error('❌ Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

const { default: app } = await import('./app.js');
const { pool } = await import('./config/db.js');

const PORT = process.env.PORT || 4000;

try {
  await pool.query('SELECT 1');
  console.log('✅ Conectado a PostgreSQL');
} catch (err) {
  console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
  process.exit(1);
}

app.listen(PORT, () => console.log(`🚀 FEATURE TECH API escuchando en http://localhost:${PORT}`));
