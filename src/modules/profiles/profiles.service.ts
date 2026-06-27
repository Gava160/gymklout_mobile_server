import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/error.middleware';
import {
  CompleteProfileInput,
  UpdateProfileInput,
  UpdatePinInput,
  VerifyPinInput,
} from './profiles.schemas';

export class ProfilesService {
  // ─── Complete Profile (Step 2 of registration) ───────────────────────────────
  async completeProfile(userId: string, input: CompleteProfileInput) {
    const { pin, ...rest } = input;

    // Check profile exists and isn't already completed
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, completed_profile_registration')
      .eq('id', userId)
      .single();

    if (!existing) {
      throw new AppError(404, 'Profile not found');
    }

    if (existing.completed_profile_registration) {
      throw new AppError(400, 'Profile is already completed');
    }

    // Hash the PIN before saving — never store plain PINs
    const hashedPin = await bcrypt.hash(pin, 12);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...rest,
        pin: hashedPin,
        date_of_birth: rest.dateOfBirth,
        weight_kg: rest.weightKg,
        height_cm: rest.heightCm,
        completed_profile_registration: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(500, 'Failed to complete profile');
    }

    // Strip pin from response — never return it
    const { pin: _pin, ...safeProfile } = data;
    return safeProfile;
  }

  // ─── Get Profile by ID ───────────────────────────────────────────────────────
  async getProfileById(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, full_name, email, avatar_url, phone, gender,
        date_of_birth, address, city, state, country,
        weight_kg, height_cm, goal, bio,
        completed_profile_registration, created_at, updated_at
      `)
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new AppError(404, 'Profile not found');
    }

    return data;
  }

  // ─── Update Profile ──────────────────────────────────────────────────────────
  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Build update object — only include fields that were provided
    const updateData: Record<string, unknown> = {};

    if (input.fullName)    updateData['full_name']    = input.fullName;
    if (input.avatarUrl)   updateData['avatar_url']   = input.avatarUrl;
    if (input.phone)       updateData['phone']        = input.phone;
    if (input.gender)      updateData['gender']       = input.gender;
    if (input.dateOfBirth) updateData['date_of_birth'] = input.dateOfBirth;
    if (input.address)     updateData['address']      = input.address;
    if (input.city)        updateData['city']         = input.city;
    if (input.state)       updateData['state']        = input.state;
    if (input.country)     updateData['country']      = input.country;
    if (input.weightKg)    updateData['weight_kg']    = input.weightKg;
    if (input.heightCm)    updateData['height_cm']    = input.heightCm;
    if (input.goal)        updateData['goal']         = input.goal;
    if (input.bio)         updateData['bio']          = input.bio;

    if (Object.keys(updateData).length === 0) {
      throw new AppError(400, 'No fields provided to update');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id, full_name, email, avatar_url, phone, gender,
        date_of_birth, address, city, state, country,
        weight_kg, height_cm, goal, bio,
        completed_profile_registration, created_at, updated_at
      `)
      .single();

    if (error) {
      throw new AppError(500, 'Failed to update profile');
    }

    return data;
  }

  // ─── Verify PIN ──────────────────────────────────────────────────────────────
  async verifyPin(userId: string, input: VerifyPinInput) {
    const { data, error } = await supabase
      .from('profiles')
      .select('pin')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new AppError(404, 'Profile not found');
    }

    if (!data.pin) {
      throw new AppError(400, 'No PIN set on this account');
    }

    const isMatch = await bcrypt.compare(input.pin, data.pin);

    if (!isMatch) {
      throw new AppError(401, 'Incorrect PIN');
    }

    return { verified: true };
  }

  // ─── Update PIN ──────────────────────────────────────────────────────────────
  async updatePin(userId: string, input: UpdatePinInput) {
    const { data, error } = await supabase
      .from('profiles')
      .select('pin')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new AppError(404, 'Profile not found');
    }

    if (!data.pin) {
      throw new AppError(400, 'No PIN set on this account');
    }

    const isMatch = await bcrypt.compare(input.currentPin, data.pin);
    if (!isMatch) {
      throw new AppError(401, 'Current PIN is incorrect');
    }

    const hashedPin = await bcrypt.hash(input.newPin, 12);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ pin: hashedPin })
      .eq('id', userId);

    if (updateError) {
      throw new AppError(500, 'Failed to update PIN');
    }

    return { message: 'PIN updated successfully' };
  }

  // ─── Delete Account ──────────────────────────────────────────────────────────
  async deleteAccount(userId: string, input: VerifyPinInput) {
    // Must verify PIN before deleting account
    await this.verifyPin(userId, input);

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new AppError(500, 'Failed to delete account');
    }

    // Profile is cascade deleted by DB foreign key
    return { message: 'Account deleted successfully' };
  }
}

export const profilesService = new ProfilesService();