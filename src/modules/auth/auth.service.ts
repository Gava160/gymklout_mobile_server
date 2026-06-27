import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/error.middleware';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './auth.schemas';

export class AuthService {
  // ─── Register ───────────────────────────────────────────────────────────────
  async register(input: RegisterInput) {
    const { email, password, username, fullName } = input;

    // Check username is not already taken
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingProfile) {
      throw new AppError(409, 'Username is already taken');
    }

    // Create auth user via Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // sends confirmation email
      user_metadata: {
        full_name: fullName,
        username,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new AppError(409, 'An account with this email already exists');
      }
      throw new AppError(400, error.message);
    }

    if (!data.user) {
      throw new AppError(500, 'Failed to create user');
    }

    // Profile is auto-created by the DB trigger we set up
    // but we need to set the username since trigger only sets full_name & avatar
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', data.user.id);

    if (profileError) {
      // Rollback — delete the auth user if profile update fails
      await supabase.auth.admin.deleteUser(data.user.id);
      throw new AppError(500, 'Failed to complete registration');
    }

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: data.user.id,
    };
  }

  // ─── Login ──────────────────────────────────────────────────────────────────
  async login(input: LoginInput) {
    const { email, password } = input;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic message — don't reveal whether email or password was wrong
      throw new AppError(401, 'Invalid email or password');
    }

    if (!data.user.email_confirmed_at) {
      throw new AppError(403, 'Please verify your email before logging in');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, goal')
      .eq('id', data.user.id)
      .single();

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile,
      },
    };
  }

  // ─── Refresh Token ───────────────────────────────────────────────────────────
  async refreshToken(input: RefreshTokenInput) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: input.refreshToken,
    });

    if (error || !data.session) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────
  async logout(accessToken: string) {
    // Invalidate the session on Supabase side
    const { error } = await supabase.auth.admin.signOut(accessToken);

    if (error) {
      throw new AppError(500, 'Failed to logout');
    }

    return { message: 'Logged out successfully' };
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  async forgotPassword(input: ForgotPasswordInput) {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: 'gymklout://reset-password', // deep link for Flutter
    });

    if (error) {
      throw new AppError(500, 'Failed to send reset email');
    }

    // Always return success — never reveal if email exists or not
    return {
      message: 'If an account with that email exists, a reset link has been sent.',
    };
  }

  // ─── Reset Password ──────────────────────────────────────────────────────────
  async resetPassword(userId: string, input: ResetPasswordInput) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: input.newPassword,
    });

    if (error) {
      throw new AppError(400, 'Failed to reset password');
    }

    return { message: 'Password reset successfully. You can now log in.' };
  }

  // ─── Change Password ─────────────────────────────────────────────────────────
  async changePassword(userId: string, input: ChangePasswordInput) {
    // Verify current password by attempting a sign-in
    const { data: userData } = await supabase.auth.admin.getUserById(userId);

    if (!userData.user?.email) {
      throw new AppError(404, 'User not found');
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: input.currentPassword,
    });

    if (verifyError) {
      throw new AppError(401, 'Current password is incorrect');
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: input.newPassword,
    });

    if (error) {
      throw new AppError(400, 'Failed to change password');
    }

    return { message: 'Password changed successfully' };
  }

  // ─── Get Current User ────────────────────────────────────────────────────────
  async getMe(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new AppError(404, 'Profile not found');
    }

    return profile;
  }
}

export const authService = new AuthService();