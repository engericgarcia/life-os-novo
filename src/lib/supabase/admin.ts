import { createClient } from "@supabase/supabase-js";

import { lerEnv, lerEnvEnvioPush } from "@/lib/env";
import { type Database } from "@/types/database";

/**
 * Cliente com a service_role — **ignora o Row Level Security**.
 *
 * Existe para um único caso: o trabalho agendado que envia o resumo diário.
 * Ele roda sem sessão de usuário e precisa varrer as preferências e tarefas
 * de todos para saber o que enviar, o que o RLS por definição impede.
 *
 * Regras que não devem ser quebradas:
 * - nunca importar isto de um Client Component;
 * - nunca usar em resposta a uma requisição de usuário comum;
 * - a chave nunca leva prefixo NEXT_PUBLIC_, então o Next não a embute no
 *   pacote do navegador.
 */
export function criarClienteAdministrativo() {
  const env = lerEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = lerEnvEnvioPush();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
