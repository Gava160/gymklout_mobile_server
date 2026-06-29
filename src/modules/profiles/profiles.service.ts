import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/error.middleware';
import {
  CompleteProfileInput,
  UpdateProfileInput,
  UpdatePinInput,
  VerifyPinInput,
} from './profiles.schemas';
import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import path from 'path';
import FormData from 'form-data';


export class ProfilesService {
  // ─── Complete Profile (Step 2 of registration) ───────────────────────────────
  async completeProfile(userId: string, input: CompleteProfileInput) {
    const { pin, ...rest } = input;

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existing) {
      throw new AppError(404, 'Profile not found');
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only hash and save PIN if provided
    if (pin) {
      updateData['pin'] = await bcrypt.hash(pin, 12);
    }

    if (rest.fullName !== undefined) updateData['full_name'] = rest.fullName;
    if (rest.phone !== undefined) updateData['phone'] = rest.phone;
    if (rest.gender !== undefined) updateData['gender'] = rest.gender;
    if (rest.dateOfBirth !== undefined) updateData['date_of_birth'] = rest.dateOfBirth;
    if (rest.address !== undefined) updateData['address'] = rest.address;
    if (rest.city !== undefined) updateData['city'] = rest.city;
    if (rest.state !== undefined) updateData['state'] = rest.state;
    if (rest.country !== undefined) updateData['country'] = rest.country;
    if (rest.weightKg !== undefined) updateData['weight_kg'] = rest.weightKg;
    if (rest.heightCm !== undefined) updateData['height_cm'] = rest.heightCm;
    if (rest.goal !== undefined) updateData['goal'] = rest.goal;
    if (rest.bio !== undefined) updateData['bio'] = rest.bio;
    if (rest.activityLevel !== undefined) updateData['activity_level'] = rest.activityLevel;
    if (rest.fitnessLevel !== undefined) updateData['fitness_level'] = rest.fitnessLevel;
    if (rest.targetWeightKg !== undefined) updateData['target_weight_kg'] = rest.targetWeightKg;
    if (rest.workoutFrequency !== undefined) updateData['workout_frequency'] = rest.workoutFrequency;
    if (rest.dateOfBirth !== undefined) {
      updateData['date_of_birth'] = rest.dateOfBirth;

      // Derive age from dateOfBirth
      const birth = new Date(rest.dateOfBirth);
      const today = new Date();
      let derivedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        derivedAge--;
      }
      updateData['age'] = derivedAge;
    }

    if (rest.completedProfileRegistration !== undefined) updateData['completed_profile_registration'] = rest.completedProfileRegistration;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('*')
      .single();
    console.log('SUPABASE UPDATE ERROR:', error);

    if (error) {
      throw new AppError(500, 'Failed to update profile');
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
        activity_level, fitness_level, target_weight_kg, workout_frequency,
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
    const updateData: Record<string, unknown> = {};

    if (input.fullName !== undefined) updateData['full_name'] = input.fullName;
    if (input.avatarUrl !== undefined) updateData['avatar_url'] = input.avatarUrl;
    if (input.phone !== undefined) updateData['phone'] = input.phone;
    if (input.gender !== undefined) updateData['gender'] = input.gender;
    if (input.dateOfBirth !== undefined) updateData['date_of_birth'] = input.dateOfBirth;
    if (input.address !== undefined) updateData['address'] = input.address;
    if (input.city !== undefined) updateData['city'] = input.city;
    if (input.state !== undefined) updateData['state'] = input.state;
    if (input.country !== undefined) updateData['country'] = input.country;
    if (input.weightKg !== undefined) updateData['weight_kg'] = input.weightKg;
    if (input.heightCm !== undefined) updateData['height_cm'] = input.heightCm;
    if (input.goal !== undefined) updateData['goal'] = input.goal;
    if (input.bio !== undefined) updateData['bio'] = input.bio;
    if (input.activityLevel !== undefined) updateData['activity_level'] = input.activityLevel;
    if (input.fitnessLevel !== undefined) updateData['fitness_level'] = input.fitnessLevel;
    if (input.targetWeightKg !== undefined) updateData['target_weight_kg'] = input.targetWeightKg;
    if (input.workoutFrequency !== undefined) updateData['workout_frequency'] = input.workoutFrequency;
    if (input.age !== undefined) updateData['age'] = input.age;

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
        activity_level, fitness_level, target_weight_kg, workout_frequency,
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
    await this.verifyPin(userId, input);

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new AppError(500, 'Failed to delete account');
    }

    return { message: 'Account deleted successfully' };
  }

  // ─── Upload Avatar ───────────────────────────────────────────────────────────
  async uploadAvatar(userId: string, fileBuffer: Buffer, mimeType: string) {
    // ── 1. Load face-api models if not already loaded ──
    const modelsPath = path.join(__dirname, '../models');
    if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    }

    // ── 2. Decode image buffer into a canvas for face-api ──
    const image = await canvas.loadImage(fileBuffer);
    const cvs = canvas.createCanvas(image.width, image.height);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(image, 0, 0);

    // ── 3. Run face detection ──
    const detections = await faceapi.detectAllFaces(
      cvs as unknown as HTMLCanvasElement,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    );

    if (detections.length === 0) {
      throw new AppError(400, 'No face detected. Please use a clear photo of your face.');
    }

    // ── 4. Upload to Cloudflare Images ──
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    formData.append('file', blob, `avatar-${userId}.jpg`);
    formData.append('id', `avatars/user-${userId}`);

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
        body: formData,
      }
    );

    const cfData = await cfResponse.json() as {
      success: boolean;
      result: { variants: string[] };
      errors: { message: string }[];
    };

    if (!cfData.success) {
      throw new AppError(500, `Cloudflare upload failed: ${cfData.errors?.[0]?.message ?? 'Unknown error'}`);
    }

    const avatarUrl = cfData.result.variants[0];

    // ── 5. Save URL to Supabase profile ──
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw new AppError(500, 'Failed to save avatar URL to profile');
    }

    return { avatarUrl };
  }

}

export const profilesService = new ProfilesService();