import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { membershipsController } from './memberships.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  joinGymSchema,
  sendPartnerRequestSchema,
  respondPartnerRequestSchema,
} from './memberships.schemas';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Joining gyms — moderate
const joinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 10,
  message: { success: false, error: 'Too many gym join attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Partner requests — prevent spam
const partnerRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many partner requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── All routes protected ─────────────────────────────────────────────────────
router.use(authenticate);

// Memberships
router.get('/my', membershipsController.getMyMemberships);
router.post('/join', joinLimiter, validate(joinGymSchema), membershipsController.joinGym);
router.delete('/leave/:gymId', membershipsController.leaveGym);

// Gym partners
router.get('/partners', membershipsController.getMyPartners);
router.get('/partners/requests/incoming', membershipsController.getIncomingRequests);
router.get('/partners/requests/sent', membershipsController.getSentRequests);

router.post(
  '/partners/request',
  partnerRequestLimiter,
  validate(sendPartnerRequestSchema),
  membershipsController.sendPartnerRequest
);

router.patch(
  '/partners/request/:requestId',
  validate(respondPartnerRequestSchema),
  membershipsController.respondToPartnerRequest
);

router.delete(
  '/partners/request/:requestId',
  membershipsController.cancelPartnerRequest
);

export default router;