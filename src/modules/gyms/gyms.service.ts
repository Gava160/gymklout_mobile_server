import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/error.middleware';
import {
  NearbyGymsInput,
  SearchGymsInput,
  CityGymsInput,
} from './gyms.schemas';

export class GymsService {
  // ─── Get Nearby Gyms (sorted by distance) ────────────────────────────────────
  // This is the main discovery query — uses PostGIS ST_DWithin + ST_Distance
  async getNearbyGyms(input: NearbyGymsInput) {
    const { latitude, longitude, radiusKm, limit, offset } = input;
    const radiusMeters = radiusKm * 1000;

    // Raw SQL for PostGIS geo query — Supabase client doesn't support
    // ST_DWithin natively so we use rpc (stored function)
    const { data, error } = await supabase.rpc('get_nearby_gyms', {
      user_lat: latitude,
      user_lng: longitude,
      radius_meters: radiusMeters,
      result_limit: limit,
      result_offset: offset,
    });

    if (error) {
      throw new AppError(500, 'Failed to fetch nearby gyms');
    }

    return {
      gyms: data ?? [],
      total: data?.length ?? 0,
      // Flag the first result as closest — list is already sorted by distance
      closestGymId: data?.[0]?.id ?? null,
    };
  }

  // ─── Get Gyms by City ─────────────────────────────────────────────────────────
  // Used when we know user's city from their profile
  async getGymsByCity(input: CityGymsInput) {
    const { city, state, country, limit, offset } = input;

    let query = supabase
      .from('gyms')
      .select(`
        id, name, description, logo_url, cover_url,
        address, city, state, country,
        latitude, longitude,
        amenities, opening_hours,
        is_active, is_verified,
        created_at, updated_at
      `, { count: 'exact' })
      .eq('is_active', true)
      .ilike('city', `%${city}%`);

    if (state)   query = query.ilike('state', `%${state}%`);
    if (country) query = query.ilike('country', `%${country}%`);

    const { data, error, count } = await query
      .order('is_verified', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(500, 'Failed to fetch gyms');
    }

    return {
      gyms: data ?? [],
      total: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    };
  }

  // ─── Search Gyms ──────────────────────────────────────────────────────────────
  async searchGyms(input: SearchGymsInput) {
    const { query, city, state, country, amenities, limit, offset } = input;

    let dbQuery = supabase
      .from('gyms')
      .select(`
        id, name, description, logo_url, cover_url,
        address, city, state, country,
        latitude, longitude,
        amenities, opening_hours,
        is_active, is_verified,
        created_at, updated_at
      `, { count: 'exact' })
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,address.ilike.%${query}%`);

    if (city)    dbQuery = dbQuery.ilike('city', `%${city}%`);
    if (state)   dbQuery = dbQuery.ilike('state', `%${state}%`);
    if (country) dbQuery = dbQuery.ilike('country', `%${country}%`);

    // Filter by amenities if provided — gym must have ALL requested amenities
    if (amenities && amenities.length > 0) {
      dbQuery = dbQuery.contains('amenities', amenities);
    }

    const { data, error, count } = await dbQuery
      .order('is_verified', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(500, 'Failed to search gyms');
    }

    return {
      gyms: data ?? [],
      total: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    };
  }

  // ─── Get Gym by ID ────────────────────────────────────────────────────────────
  async getGymById(gymId: string) {
    const { data, error } = await supabase
      .from('gyms')
      .select(`
        id, name, description, email, phone, website,
        logo_url, cover_url, address, city, state, country,
        latitude, longitude, amenities, opening_hours,
        is_active, is_verified, created_at, updated_at
      `)
      .eq('id', gymId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new AppError(404, 'Gym not found');
    }

    // Get member count separately
    const { count: memberCount } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active');

    return {
      ...data,
      memberCount: memberCount ?? 0,
    };
  }

  // ─── Get Gym Members ──────────────────────────────────────────────────────────
  async getGymMembers(gymId: string, limit: number = 20, offset: number = 0) {
    // Verify gym exists
    const { data: gym } = await supabase
      .from('gyms')
      .select('id')
      .eq('id', gymId)
      .eq('is_active', true)
      .single();

    if (!gym) {
      throw new AppError(404, 'Gym not found');
    }

    const { data, error, count } = await supabase
      .from('memberships')
      .select(`
        id, role, status, joined_at,
        profiles (
          id, full_name, avatar_url, bio, goal
        )
      `, { count: 'exact' })
      .eq('gym_id', gymId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(500, 'Failed to fetch gym members');
    }

    return {
      members: data ?? [],
      total: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    };
  }
}

export const gymsService = new GymsService();