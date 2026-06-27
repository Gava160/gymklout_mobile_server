import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schemas';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Strict: login & register — 10 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict: forgot password — 5 attempts per hour
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many password reset requests. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate: token refresh — 30 per 15 min
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many refresh attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshLimiter, validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.post('/reset-password', authenticate, validate(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;