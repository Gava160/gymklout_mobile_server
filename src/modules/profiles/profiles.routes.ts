import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { profilesController } from './profiles.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  completeProfileSchema,
  updateProfileSchema,
  updatePinSchema,
  verifyPinSchema,
} from './profiles.schemas';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// PIN operations — very strict
const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many PIN attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Profile updates — moderate
const updateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many update requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Delete account — very strict
const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many delete attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── All routes are protected ─────────────────────────────────────────────────
router.use(authenticate);

router.get('/me', profilesController.getMyProfile);

router.post(
  '/complete',
  (req, res, next) => {
    console.log('HIT /complete route');
    console.log('HEADERS:', req.headers.authorization?.substring(0, 20));
    next();
  },
  updateLimiter,
  validate(completeProfileSchema),
  profilesController.completeProfile
);

router.patch(
  '/me',
  updateLimiter,
  validate(updateProfileSchema),
  profilesController.updateProfile
);

router.post(
  '/pin/verify',
  pinLimiter,
  validate(verifyPinSchema),
  profilesController.verifyPin
);

router.patch(
  '/pin',
  pinLimiter,
  validate(updatePinSchema),
  profilesController.updatePin
);

router.delete(
  '/me',
  deleteLimiter,
  validate(verifyPinSchema),
  profilesController.deleteAccount
);

router.get('/:userId', profilesController.getProfileById);


export default router;