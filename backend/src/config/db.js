import pg from 'pg';

const { Pool, types } = pg;

// NUMERIC (1700) se devuelve como número en lugar de string
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

export const query = (text, params) => pool.query(text, params);

/** Ejecuta `fn(client)` dentro de una transacción (BEGIN/COMMIT/ROLLBACK). */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
