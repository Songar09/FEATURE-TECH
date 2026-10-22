import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from './config/passport.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import productRoutes from './routes/products.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/orders.routes.js';
import supportRoutes from './routes/support.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(passport.initialize());

app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'FEATURE TECH API' }));

app.use('/api/auth', authRoutes);         // Público + Google OAuth
app.use('/api/users', userRoutes);        // Administrador
app.use('/api/products', productRoutes);  // Público (lectura) / Admin / Empleado (stock)
app.use('/api/cart', cartRoutes);         // Cliente
app.use('/api/orders', orderRoutes);      // Cliente / Empleado / Administrador
app.use('/api/support', supportRoutes);   // Cliente / Empleado / Administrador
app.use('/api/dashboard', dashboardRoutes); // Administrador / Empleado
app.use('/api/chatbot', chatbotRoutes);   // Público (con datos de pedidos si hay sesión)

app.use(notFound);
app.use(errorHandler);

export default app;
