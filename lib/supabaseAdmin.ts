// SERVER-ONLY. Uses the Supabase service role key, which bypasses Row Level Security.
// Never import this file from a page component, a "use client" file, or anything that
// ships to the browser — only from files under pages/api/.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!serviceRoleKey && process.env.NODE_ENV !== 'production') {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set — admin API routes will fail.');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});