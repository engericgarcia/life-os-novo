import { createBrowserClient } from "@supabase/ssr";

import { lerEnv } from "@/lib/env";
import { type Database } from "@/types/database";

/** Cliente Supabase para uso em Client Components. */
export function criarClienteNavegador() {
  const env = lerEnv();

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
