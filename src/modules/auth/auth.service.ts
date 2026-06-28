import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/error.middleware';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  VerifyOtpInput,
  ResendVerificationInput,
} from './auth.schemas';

export class AuthService {

  // ─── Verify OTP ──────────────────────────────────────────────────────────────
async verifyOtp(input: VerifyOtpInput) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: 'signup',
  });

  if (error) {
    throw new AppError(400, 'Invalid or expired OTP code');
  }

  if (!data.session) {
    throw new AppError(400, 'Verification failed. Please try again.');
  }

  return {
    message: 'Email verified successfully.',
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
  };
}

// ─── Resend Verification Email ───────────────────────────────────────────────
async resendVerification(input: ResendVerificationInput) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: input.email,
  });

  if (error) {
    throw new AppError(500, 'Failed to resend verification email');
  }

  return {
    message: 'Verification email resent. Please check your inbox.',
  };
}

  // ─── Register ───────────────────────────────────────────────────────────────
  async register(input: RegisterInput) {
  const { email, password, fullName, avatarUrl } = input;

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const found = existingUsers?.users?.find((u) => u.email === email);

  if (found) {
    if (!found.email_confirmed_at) {
      await supabase.auth.resend({ type: 'signup', email });
      throw new AppError(409, 'Account already exists but is not verified. A new code has been sent to your email.');
    }
    throw new AppError(409, 'An account with this email already exists');
  }

  // Use signUp instead of admin.createUser so password is properly stored
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        avatar_url: avatarUrl ?? null,
      },
    },
  });

  if (error) {
    throw new AppError(400, error.message);
  }

  if (!data.user) {
    throw new AppError(500, 'Failed to create user');
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
    throw new AppError(401, 'Invalid email or password');
  }

  if (!data.user.email_confirmed_at) {
    // Auto-resend OTP so they have a fresh code
    await supabase.auth.resend({
      type: 'signup',
      email,
    });
    throw new AppError(403, 'Please verify your email before logging in');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, goal, completed_profile_registration, created_at, updated_at')
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
    const { error } = await supabase.auth.admin.signOut(accessToken);

    if (error) {
      throw new AppError(500, 'Failed to logout');
    }

    return { message: 'Logged out successfully' };
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  async forgotPassword(input: ForgotPasswordInput) {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: 'gymklout://reset-password',
    });

    if (error) {
      throw new AppError(500, 'Failed to send reset email');
    }

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