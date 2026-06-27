import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { profilesService } from './profiles.service';

export class ProfilesController {
  async completeProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await profilesService.completeProfile(req.user!.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await profilesService.getProfileById(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

 async getProfileById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId as string;
    const data = await profilesService.getProfileById(userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await profilesService.updateProfile(req.user!.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async verifyPin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await profilesService.verifyPin(req.user!.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updatePin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await profilesService.updatePin(req.user!.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await profilesService.deleteAccount(req.user!.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const profilesController = new ProfilesController();