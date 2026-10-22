/**
 * Script de inicialización (seed).
 *   npm run seed
 *
 * - Inserta el Administrador principal si no existe (contraseña encriptada con bcrypt).
 * - Si el correo ya existe, garantiza que tenga rol Administrador y estado activo,
 *   pero NO sobrescribe su contraseña (el script es idempotente).
 * - Inserta productos de ejemplo si el catálogo está vacío.
 *
 * Las credenciales se leen de variables de entorno (.env): SEED_ADMIN_EMAIL,
 * SEED_ADMIN_PASSWORD y SEED_ADMIN_NAME. La contraseña nunca se imprime.
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

const SALT_ROUNDS = 12;
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'robinson.garcia@cun.edu.co').toLowerCase();
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Administrador Principal';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

const PRODUCTS = [
  ['Laptop Nova X15', 'Intel Core i7 13ª gen, 16 GB RAM, SSD 1 TB, pantalla 15.6" 144 Hz.', 'Laptops', 'Nova', 4899000, 12, 5, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'],
  ['Smartphone Pulse 12 Pro', 'Pantalla AMOLED 6.7", 256 GB, cámara triple 108 MP, 5G.', 'Smartphones', 'Pulse', 3299000, 3, 5, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
  ['Audífonos Quantum ANC', 'Cancelación activa de ruido, 40 h de batería, Bluetooth 5.3.', 'Audio', 'Quantum', 689000, 40, 10, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
  ['Smartwatch Orbit S', 'Monitor cardiaco, GPS, resistente al agua 5 ATM.', 'Wearables', 'Orbit', 899000, 0, 5, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
  ['Monitor Neon 27" 4K', 'Panel IPS 4K UHD, HDR400, 144 Hz, USB-C 90 W.', 'Monitores', 'Neon', 1799000, 8, 4, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'],
  ['Teclado Mecánico Vortex RGB', 'Switches rojos, RGB por tecla, layout español.', 'Accesorios', 'Vortex', 349000, 25, 8, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800'],
  ['Tablet Lumen 11', 'Pantalla 11" 120 Hz, 128 GB, lápiz incluido.', 'Tablets', 'Lumen', 2199000, 4, 5, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'],
  ['Consola Hyper One', '1 TB SSD, 4K 120 FPS, control inalámbrico.', 'Gaming', 'Hyper', 2799000, 15, 5, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800'],
];

async function seedAdmin(client) {
  const { rows } = await client.query('SELECT id_usuario FROM Usuario WHERE correo = $1', [ADMIN_EMAIL]);
  if (rows[0]) {
    await client.query(
      `UPDATE Usuario SET rol = 'Administrador', estado = 'activo' WHERE id_usuario = $1`,
      [rows[0].id_usuario]
    );
    console.log(`ℹ️  El administrador ${ADMIN_EMAIL} ya existía: se verificó su rol (contraseña sin cambios).`);
    return;
  }
  if (!ADMIN_PASSWORD) {
    throw new Error('Defina SEED_ADMIN_PASSWORD en el archivo .env antes de ejecutar el seed');
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  await client.query(
    `INSERT INTO Usuario (nombre, correo, contrasena_hash, rol, estado)
     VALUES ($1, $2, $3, 'Administrador', 'activo')`,
    [ADMIN_NAME, ADMIN_EMAIL, hash]
  );
  console.log(`✅ Administrador principal creado: ${ADMIN_EMAIL} (contraseña encriptada con bcrypt)`);
}

async function seedProducts(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM Producto');
  if (rows[0].n > 0) {
    console.log(`ℹ️  El catálogo ya tiene ${rows[0].n} productos; no se insertan ejemplos.`);
    return;
  }
  for (const p of PRODUCTS) {
    await client.query(
      `INSERT INTO Producto (nombre, descripcion, categoria, marca, precio, stock, stock_minimo, imagen_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      p
    );
  }
  console.log(`✅ ${PRODUCTS.length} productos de ejemplo insertados.`);
}

const client = await pool.connect();
try {
  await client.query('BEGIN');
  await seedAdmin(client);
  await seedProducts(client);
  await client.query('COMMIT');
  console.log('🌱 Seed completado.');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('❌ Error en el seed:', err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
