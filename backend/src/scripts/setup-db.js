/**
 * Prepara la base de datos al arrancar en la nube (Render).
 *   npm run setup-db
 *
 * - Si la base está vacía (no existe la tabla Usuario), carga database/schema.cloud.sql.
 * - Aplica las migraciones de database/migrations (son idempotentes).
 * No borra ni sobrescribe datos existentes.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const dbDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../database');

try {
  const { rows } = await pool.query(`SELECT to_regclass('usuario') AS t`);
  if (!rows[0].t) {
    await pool.query(await fs.readFile(path.join(dbDir, 'schema.cloud.sql'), 'utf8'));
    console.log('✅ Esquema creado (schema.cloud.sql)');
  } else {
    console.log('ℹ️  El esquema ya existe; no se recrea.');
  }
  const migDir = path.join(dbDir, 'migrations');
  const files = (await fs.readdir(migDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    await pool.query(await fs.readFile(path.join(migDir, f), 'utf8'));
    console.log(`✅ Migración aplicada: ${f}`);
  }
} catch (err) {
  console.error('❌ Error preparando la base de datos:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
