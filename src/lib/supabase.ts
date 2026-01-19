import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type SupabaseAdminClient = ReturnType<typeof createClient<Database>>;

let cachedClient: SupabaseAdminClient | null = null;

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  return cachedClient;
}
