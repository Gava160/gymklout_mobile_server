import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { visitsController } from './visits.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { checkInSchema } from './visits.schemas';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const checkInLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many check-in attempts. Try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── All routes protected ─────────────────────────────────────────────────────
router.use(authenticate);

router.post('/check-in', checkInLimiter, validate(checkInSchema), visitsController.checkIn);
router.get('/history', readLimiter, visitsController.getHistory);
router.get('/stats', readLimiter, visitsController.getStats);

export default router;