import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify the Supabase JWT
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }
    console.log('AUTH HEADER:', req.headers.authorization?.substring(0, 30));
    console.log('PATH:', req.path);

    req.user = {
      id: user.id,
      email: user.email ?? '',
      role: user.role,
    };

    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};