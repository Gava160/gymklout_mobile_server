import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/error.middleware';
import {
  JoinGymInput,
  SendPartnerRequestInput,
  RespondPartnerRequestInput,
} from './memberships.schemas';

export class MembershipsService {
  // ─── Join a Gym ───────────────────────────────────────────────────────────────
  async joinGym(userId: string, input: JoinGymInput) {
    const { gymId } = input;

    // Verify gym exists and is active
    const { data: gym } = await supabase
      .from('gyms')
      .select('id, name, is_active')
      .eq('id', gymId)
      .eq('is_active', true)
      .single();

    if (!gym) {
      throw new AppError(404, 'Gym not found or is no longer active');
    }

    // Check if membership already exists
    const { data: existing } = await supabase
      .from('memberships')
      .select('id, status')
      .eq('user_id', userId)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        throw new AppError(409, 'You are already a member of this gym');
      }

      // Re-activate if previously inactive
      if (existing.status === 'inactive') {
        const { data, error } = await supabase
          .from('memberships')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select(`
            id, user_id, gym_id, role, status,
            joined_at, expires_at, created_at, updated_at,
            gyms ( id, name, logo_url, city, state, country )
          `)
          .single();

        if (error) throw new AppError(500, 'Failed to rejoin gym');
        return data;
      }
    }

    // Create new membership
    const { data, error } = await supabase
      .from('memberships')
      .insert({
        user_id: userId,
        gym_id: gymId,
        role: 'member',
        status: 'active',
      })
      .select(`
        id, user_id, gym_id, role, status,
        joined_at, expires_at, created_at, updated_at,
        gyms ( id, name, logo_url, city, state, country )
      `)
      .single();

    if (error) {
      throw new AppError(500, 'Failed to join gym');
    }

    return data;
  }

  // ─── Leave a Gym ──────────────────────────────────────────────────────────────
  async leaveGym(userId: string, gymId: string) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('id, status, role')
      .eq('user_id', userId)
      .eq('gym_id', gymId)
      .maybeSingle();

    if (!membership) {
      throw new AppError(404, 'You are not a member of this gym');
    }

    if (membership.status === 'inactive') {
      throw new AppError(400, 'You have already left this gym');
    }

    // Set to inactive instead of deleting — preserves history
    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.id);

    if (error) {
      throw new AppError(500, 'Failed to leave gym');
    }

    return { message: 'You have successfully left the gym' };
  }

  // ─── Get My Memberships ───────────────────────────────────────────────────────
  async getMyMemberships(userId: string) {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id, user_id, gym_id, role, status,
        joined_at, expires_at, created_at, updated_at,
        gyms (
          id, name, description, logo_url, cover_url,
          address, city, state, country,
          latitude, longitude, is_verified
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'Failed to fetch memberships');
    }

    return data ?? [];
  }

  // ─── Send Gym Partner Request ─────────────────────────────────────────────────
  async sendPartnerRequest(senderId: string, input: SendPartnerRequestInput) {
    const { receiverId, gymId } = input;

    // Must be a member of that gym to send a request
    const { data: senderMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', senderId)
      .eq('gym_id', gymId)
      .eq('status', 'active')
      .maybeSingle();

    if (!senderMembership) {
      throw new AppError(403, 'You must be a member of this gym to send partner requests');
    }

    // Receiver must also be a member of the same gym
    const { data: receiverMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', receiverId)
      .eq('gym_id', gymId)
      .eq('status', 'active')
      .maybeSingle();

    if (!receiverMembership) {
      throw new AppError(404, 'This user is not a member of the same gym');
    }

    // Check if request already exists in any direction
    const { data: existing } = await supabase
      .from('gym_partner_requests')
      .select('id, status')
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),` +
        `and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .eq('gym_id', gymId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        throw new AppError(409, 'A partner request already exists between you two');
      }
      if (existing.status === 'accepted') {
        throw new AppError(409, 'You are already gym partners');
      }

      // Declined before — allow resending by updating status back to pending
      const { data, error } = await supabase
        .from('gym_partner_requests')
        .update({
          status: 'pending',
          sender_id: senderId,
          receiver_id: receiverId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select(`
          id, sender_id, receiver_id, gym_id, status, created_at, updated_at,
          sender:profiles!gym_partner_requests_sender_id_fkey (
            id, full_name, avatar_url
          ),
          receiver:profiles!gym_partner_requests_receiver_id_fkey (
            id, full_name, avatar_url
          )
        `)
        .single();

      if (error) throw new AppError(500, 'Failed to send partner request');
      return data;
    }

    // Create fresh request
    const { data, error } = await supabase
      .from('gym_partner_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        gym_id: gymId,
        status: 'pending',
      })
      .select(`
        id, sender_id, receiver_id, gym_id, status, created_at, updated_at,
        sender:profiles!gym_partner_requests_sender_id_fkey (
          id, full_name, avatar_url
        ),
        receiver:profiles!gym_partner_requests_receiver_id_fkey (
          id, full_name, avatar_url
        )
      `)
      .single();

    if (error) {
      throw new AppError(500, 'Failed to send partner request');
    }

    return data;
  }

  // ─── Respond to Partner Request ───────────────────────────────────────────────
  async respondToPartnerRequest(
    userId: string,
    requestId: string,
    input: RespondPartnerRequestInput
  ) {
    const { data: request } = await supabase
      .from('gym_partner_requests')
      .select('id, sender_id, receiver_id, status')
      .eq('id', requestId)
      .eq('receiver_id', userId)   // only the receiver can respond
      .maybeSingle();

    if (!request) {
      throw new AppError(404, 'Partner request not found');
    }

    if (request.status !== 'pending') {
      throw new AppError(400, `Request has already been ${request.status}`);
    }

    const { data, error } = await supabase
      .from('gym_partner_requests')
      .update({
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select(`
        id, sender_id, receiver_id, gym_id, status, created_at, updated_at,
        sender:profiles!gym_partner_requests_sender_id_fkey (
          id, full_name, avatar_url
        ),
        receiver:profiles!gym_partner_requests_receiver_id_fkey (
          id, full_name, avatar_url
        )
      `)
      .single();

    if (error) {
      throw new AppError(500, 'Failed to respond to partner request');
    }

    return data;
  }

  // ─── Get My Partner Requests ──────────────────────────────────────────────────
  async getIncomingRequests(userId: string) {
    const { data, error } = await supabase
      .from('gym_partner_requests')
      .select(`
        id, sender_id, receiver_id, gym_id, status, created_at, updated_at,
        sender:profiles!gym_partner_requests_sender_id_fkey (
          id, full_name, avatar_url, bio, goal
        ),
        gyms ( id, name, logo_url, city )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'Failed to fetch incoming requests');
    }

    return data ?? [];
  }

  async getSentRequests(userId: string) {
    const { data, error } = await supabase
      .from('gym_partner_requests')
      .select(`
        id, sender_id, receiver_id, gym_id, status, created_at, updated_at,
        receiver:profiles!gym_partner_requests_receiver_id_fkey (
          id, full_name, avatar_url, bio, goal
        ),
        gyms ( id, name, logo_url, city )
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'Failed to fetch sent requests');
    }

    return data ?? [];
  }

  // ─── Get My Gym Partners ──────────────────────────────────────────────────────
  async getMyPartners(userId: string) {
    const { data, error } = await supabase
      .from('gym_partner_requests')
      .select(`
        id, sender_id, receiver_id, gym_id, status, created_at, updated_at,
        sender:profiles!gym_partner_requests_sender_id_fkey (
          id, full_name, avatar_url, bio, goal
        ),
        receiver:profiles!gym_partner_requests_receiver_id_fkey (
          id, full_name, avatar_url, bio, goal
        ),
        gyms ( id, name, logo_url, city )
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'Failed to fetch gym partners');
    }

    // Normalize — always return the other person as "partner"
    return (data ?? []).map((r: any) => ({
      requestId: r.id,
      gymId: r.gym_id,
      gym: r.gyms,
      since: r.updated_at,
      partner: r.sender_id === userId ? r.receiver : r.sender,
    }));
  }

  // ─── Cancel a Sent Request ────────────────────────────────────────────────────
  async cancelPartnerRequest(userId: string, requestId: string) {
    const { data: request } = await supabase
      .from('gym_partner_requests')
      .select('id, status')
      .eq('id', requestId)
      .eq('sender_id', userId)
      .maybeSingle();

    if (!request) {
      throw new AppError(404, 'Request not found');
    }

    if (request.status !== 'pending') {
      throw new AppError(400, 'Only pending requests can be cancelled');
    }

    const { error } = await supabase
      .from('gym_partner_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      throw new AppError(500, 'Failed to cancel request');
    }

    return { message: 'Partner request cancelled' };
  }
}

export const membershipsService = new MembershipsService();