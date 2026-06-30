import { z } from 'zod';

export const nearbyGymsSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  longitude: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  radiusKm: z
    .number()
    .min(1, 'Radius must be at least 1km')
    .max(100, 'Radius cannot exceed 100km')
    .default(10),
  state: z
    .string()
    .trim()
    .min(1, 'State is required')
    .max(100, 'State name too long')
    .optional(),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(20),
  offset: z
    .number()
    .min(0)
    .default(0),
});

export const searchGymsSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Query too long')
    .trim(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  amenities: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export const cityGymsSchema = z.object({
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export type NearbyGymsInput = z.infer<typeof nearbyGymsSchema>;
export type SearchGymsInput = z.infer<typeof searchGymsSchema>;
export type CityGymsInput = z.infer<typeof cityGymsSchema>;