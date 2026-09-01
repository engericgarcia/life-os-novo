import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { lerEnv } from "@/lib/env";
import { type Database } from "@/types/database";

/** Cookies que o Supabase pede para gravar após renovar a sessão. */
type CookiesParaDefinir = Array<{
  name: string;
  value: string;
  options: CookieOptions;
}>;

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 *
 * Precisa ser criado por requisição (nunca em escopo de módulo), porque
 * carrega os cookies de sessão daquela requisição.
 */
export async function criarClienteServidor() {
  // `cookies()` vem antes da leitura do env de propósito: durante o
  // `next build` é ele que marca a rota como dinâmica. Validar o env antes
  // faria a pré-renderização estourar em quem clona o repositório sem as
  // variáveis — justamente o que `lerEnv` promete evitar.
  const cookieStore = await cookies();
  const env = lerEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaDefinir: CookiesParaDefinir) {
          try {
            for (const { name, value, options } of cookiesParaDefinir) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components não podem escrever cookies. Ignorar é seguro
            // aqui porque o middleware já renova a sessão a cada requisição.
          }
        },
      },
    },
  );
}

/**
 * Usuário autenticado da requisição atual, ou `null`.
 *
 * Usa `getUser()` (e não `getSession()`): o token é revalidado no servidor de
 * autenticação, então o resultado é confiável para decisões de acesso.
 */
export async function obterUsuario() {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

/**
 * Usuário autenticado ou erro. Use nas Server Actions, onde a rota já passou
 * pelo middleware e a ausência de sessão é uma condição excepcional.
 */
export async function exigirUsuario() {
  const usuario = await obterUsuario();

  if (!usuario) {
    throw new Error("Sessão expirada. Entre novamente para continuar.");
  }

  return usuario;
}
