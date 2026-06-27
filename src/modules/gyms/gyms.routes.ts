import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { gymsController } from './gyms.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { nearbyGymsSchema, searchGymsSchema, cityGymsSchema } from './gyms.schemas';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Geo queries are expensive — keep this tight
const geoLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 30,
  message: { success: false, error: 'Too many location requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many search requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── All routes protected ─────────────────────────────────────────────────────
router.use(authenticate);

// Discovery
router.get('/nearby', geoLimiter, gymsController.getNearbyGyms);
router.get('/city', searchLimiter, gymsController.getGymsByCity);
router.get('/search', searchLimiter, gymsController.searchGyms);

// Single gym
router.get('/:gymId', gymsController.getGymById);
router.get('/:gymId/members', gymsController.getGymMembers);

export default router;