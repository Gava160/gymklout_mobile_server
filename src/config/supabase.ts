import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Service role client — full access, backend only
export const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Anon client — used to verify user JWTs
export const supabaseAnon = createClient(
  env.supabase.url,
  env.supabase.anonKey
);