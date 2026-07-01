import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/error.middleware';
import { CheckInInput } from './visits.schemas';

interface VisitStats {
  dailyStreak: number;
  monthlyStreak: number;
  totalVisits: number;
  currentMonthVisits: number;
}

export class VisitsService {
  // ─── Check In (record today's visit) ──────────────────────────────────────────
  async checkIn(userId: string, input: CheckInInput) {
    const { gymId } = input;

    // Must have an active membership at this gym
    const { data: membership } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('gym_id', gymId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      throw new AppError(403, 'You must have an active membership at this gym to check in');
    }

    const today = new Date().toISOString().split('T')[0];

    // Already checked in today?
    const { data: existing } = await supabase
      .from('visits')
      .select('id')
      .eq('user_id', userId)
      .eq('gym_id', gymId)
      .eq('visit_date', today)
      .maybeSingle();

    if (existing) {
      return { alreadyCheckedIn: true, visitDate: today };
    }

    const { error } = await supabase
      .from('visits')
      .insert({ user_id: userId, gym_id: gymId, visit_date: today });

    if (error) {
      throw new AppError(500, 'Failed to record visit');
    }

    return { alreadyCheckedIn: false, visitDate: today };
  }

  // ─── Get Visit History (for calendar) ─────────────────────────────────────────
  async getVisitHistory(userId: string, month?: string) {
    let query = supabase
      .from('visits')
      .select('visit_date')
      .eq('user_id', userId)
      .order('visit_date', { ascending: true });

    if (month) {
      const startDate = `${month}-01`;
      const [year, mon] = month.split('-').map(Number);
      const endDate = new Date(year, mon, 0).toISOString().split('T')[0];
      query = query.gte('visit_date', startDate).lte('visit_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, 'Failed to fetch visit history');
    }

    return (data ?? []).map((v) => v.visit_date as string);
  }

  // ─── Get Visit Stats (streaks + counts) ───────────────────────────────────────
  async getVisitStats(userId: string): Promise<VisitStats> {
    const thirteenMonthsAgo = new Date();
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
    const cutoff = thirteenMonthsAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('visits')
      .select('visit_date')
      .eq('user_id', userId)
      .gte('visit_date', cutoff)
      .order('visit_date', { ascending: false });

    if (error) {
      throw new AppError(500, 'Failed to compute visit stats');
    }

    const visitDates = [...new Set((data ?? []).map((v) => v.visit_date as string))];

    const { count, error: countError } = await supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      throw new AppError(500, 'Failed to count total visits');
    }

    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);

    return {
      dailyStreak: this.computeDailyStreak(visitDates),
      monthlyStreak: this.computeMonthlyStreak(visitDates),
      totalVisits: count ?? 0,
      currentMonthVisits: visitDates.filter((d) => d.startsWith(currentMonthPrefix)).length,
    };
  }

  // ─── Private: Daily Streak ─────────────────────────────────────────────────────
  private computeDailyStreak(sortedDescDates: string[]): number {
    if (sortedDescDates.length === 0) return 0;

    const dateSet = new Set(sortedDescDates);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) return 0;

    let streak = 0;
    const cursor = dateSet.has(todayStr) ? new Date(today) : yesterday;

    while (dateSet.has(cursor.toISOString().split('T')[0])) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  // ─── Private: Monthly Streak ────────────────────────────────────────────────────
  private computeMonthlyStreak(sortedDescDates: string[]): number {
    if (sortedDescDates.length === 0) return 0;

    const monthsWithVisit = new Set(sortedDescDates.map((d) => d.slice(0, 7)));
    const key = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    if (!monthsWithVisit.has(key(year, month))) {
      month -= 1;
      if (month < 0) { month = 11; year -= 1; }
      if (!monthsWithVisit.has(key(year, month))) return 0;
    }

    let streak = 0;
    while (monthsWithVisit.has(key(year, month))) {
      streak++;
      month -= 1;
      if (month < 0) { month = 11; year -= 1; }
    }

    return streak;
  }
}

export const visitsService = new VisitsService();