/**
 * Crea las cuentas de empleados de ejemplo.
 *   npm run seed:empleados
 *
 * - Genera una contraseña aleatoria para cada empleado nuevo, la guarda con bcrypt
 *   y la muestra UNA sola vez en consola. No se escribe en ningún archivo.
 * - Es idempotente: si el correo ya existe no cambia su contraseña.
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

const SALT_ROUNDS = 12;
const EMPLOYEES = [
  ['Empleado Uno', 'empleado1@featuretech.co'],
  ['Empleado Dos', 'empleado2@featuretech.co'],
];

// 16 caracteres con mayúsculas, minúsculas, dígitos y símbolos
function randomPassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!#$%*+-.?@'];
  const all = sets.join('');
  const chars = sets.map((s) => s[crypto.randomInt(s.length)]);
  while (chars.length < 16) chars.push(all[crypto.randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const [nombre, correo] of EMPLOYEES) {
    const { rowCount } = await client.query('SELECT 1 FROM Usuario WHERE correo = $1', [correo]);
    if (rowCount) {
      console.log(`ℹ️  ${correo} ya existía: contraseña sin cambios.`);
      continue;
    }
    const contrasena = randomPassword();
    await client.query(
      `INSERT INTO Usuario (nombre, correo, contrasena_hash, rol, estado)
       VALUES ($1, $2, $3, 'Empleado', 'activo')`,
      [nombre, correo, await bcrypt.hash(contrasena, SALT_ROUNDS)]
    );
    console.log(`✅ Empleado creado: ${correo}  contraseña: ${contrasena}`);
  }
  await client.query('COMMIT');
  console.log('Guarde estas contraseñas: no se vuelven a mostrar.');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('❌ Error creando empleados:', err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
