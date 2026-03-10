import { createBrowserClient } from "@supabase/ssr";

function normalizeSupabaseUrl(raw: string): string {
  const value = raw.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `https://${value}`;
}

export function createSupabaseBrowserClient() {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
