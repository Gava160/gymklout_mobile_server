import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
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

// ─── Multer — memory storage (no disk write) ──────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB hard limit at multer level
});

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many PIN attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const updateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many update requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many delete attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Avatar upload — strict
const avatarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many avatar upload attempts. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── All routes are protected ─────────────────────────────────────────────────
router.use(authenticate);

router.get('/me', profilesController.getMyProfile);

router.post(
  '/complete',
  (req, res, next) => {
    console.log('BODY:', JSON.stringify(req.body));
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

// ─── Avatar upload ────────────────────────────────────────────────────────────
router.post(
  '/avatar',
  avatarLimiter,
  upload.single('avatar'),
  profilesController.uploadAvatar
);

router.get('/:userId', profilesController.getProfileById);

export default router;