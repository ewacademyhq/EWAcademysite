import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Bypasses Row Level Security with the service_role key. Never import this
 * from a Client Component — the `server-only` guard throws at build time if
 * something tries. Use only in server actions, route handlers, or scripts
 * that need to write data before real auth/RLS policies exist (Fase 1–2).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
