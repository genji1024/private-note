import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars not set. Using stub client.");
}

export const supabase = createClient(
  supabaseUrl || "https://stub.supabase.co",
  supabaseAnonKey || "stub-anon-key",
  { auth: { persistSession: false } }
);

export const supabaseAdmin = createClient(
  supabaseUrl || "https://stub.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "stub-service-key",
  { auth: { persistSession: false } }
);
