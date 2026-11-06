import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from './config/passport.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import clientRoutes from './routes/clients.routes.js';
import productRoutes from './routes/products.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/orders.routes.js';
import supportRoutes from './routes/support.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';

const app = express();

// En Render la URL pública llega en RENDER_EXTERNAL_URL; se usa si no se definió FRONTEND_URL
if (!process.env.FRONTEND_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.FRONTEND_URL = process.env.RENDER_EXTERNAL_URL;
}

app.set('trust proxy', 1); // detrás del proxy de Render (necesario para el rate limit)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'https:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      },
    },
  })
);
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(passport.initialize());

app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'FEATURE TECH API' }));

app.use('/api/auth', authRoutes);         // Público + Google OAuth
app.use('/api/users', userRoutes);        // Administrador
app.use('/api/clients', clientRoutes);    // Administrador / Empleado
app.use('/api/products', productRoutes);  // Público (lectura) / Admin / Empleado (stock)
app.use('/api/cart', cartRoutes);         // Cliente
app.use('/api/orders', orderRoutes);      // Cliente / Empleado / Administrador
app.use('/api/support', supportRoutes);   // Cliente / Empleado / Administrador
app.use('/api/dashboard', dashboardRoutes); // Administrador / Empleado
app.use('/api/chatbot', chatbotRoutes);   // Público (con datos de pedidos si hay sesión)

// Si existe el build del frontend (frontend/dist), se sirve desde el mismo servidor
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

export default app;
