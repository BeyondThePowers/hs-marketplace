import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export function createServiceClient() {
  const runtimeEnv = import.meta.env ?? process.env;
  const supabaseUrl = runtimeEnv.SUPABASE_URL;
  const serviceRoleKey = runtimeEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
