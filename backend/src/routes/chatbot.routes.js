import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { answer } from '../services/chatbot.service.js';

const router = Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 30 });

/** POST /api/chatbot { mensaje } → si hay sesión, puede consultar los pedidos del usuario */
router.post('/', limiter, optionalAuth, asyncHandler(async (req, res) => {
  res.json(await answer(req.body.mensaje, req.user));
}));

export default router;
