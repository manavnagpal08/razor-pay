import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wvjdygfjjtldghaddrgf.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_D_RC99A51rpcWmA4J49R0Q_Qqt1uKEk";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );