import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wvjdygfjjtldghaddrgf.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_D_RC99A51rpcWmA4J49R0Q_Qqt1uKEk";

export const createClient = async (cookieStore?: Awaited<ReturnType<typeof cookies>>) => {
  const store = cookieStore || await cookies();
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Server Component ignore
          }
        },
      },
    },
  );
};