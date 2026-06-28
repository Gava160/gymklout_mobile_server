import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { authService } from './auth.service';

export class AuthController {
  async verifyOtp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyOtp(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async resendVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendVerification(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.refreshToken(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization!.split(' ')[1];
      const result = await authService.logout(token);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.user!.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.changePassword(req.user!.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.getMe(req.user!.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();