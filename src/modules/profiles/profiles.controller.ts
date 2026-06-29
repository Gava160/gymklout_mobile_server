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

  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    const { mimetype, buffer, size } = req.file;

    // Validate mime type and size before hitting face detection
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimetype)) {
      res.status(400).json({ success: false, message: 'Only JPEG, PNG, and WebP images are allowed' });
      return;
    }

    if (size > 5 * 1024 * 1024) {
      res.status(400).json({ success: false, message: 'Image must be under 5MB' });
      return;
    }

    const data = await profilesService.uploadAvatar(req.user!.id, buffer, mimetype);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

}

export const profilesController = new ProfilesController();