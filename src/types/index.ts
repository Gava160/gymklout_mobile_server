import { Request } from 'express';
import multer from 'multer';

// Authenticated request — available after auth middleware
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  file?: Express.Multer.File;
}

// Standard API response shape
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}