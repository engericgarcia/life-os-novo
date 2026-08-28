import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { lerEnv } from "@/lib/env";
import { type Database } from "@/types/database";

/** Cookies que o Supabase pede para gravar após renovar a sessão. */
type CookiesParaDefinir = Array<{
  name: string;
  value: string;
  options: CookieOptions;
}>;

/** Rotas acessíveis sem sessão. */
const ROTAS_PUBLICAS = ["/entrar", "/cadastro", "/auth"];

/** Para onde o usuário autenticado vai ao acessar a raiz ou as telas de login. */
export const ROTA_INICIAL = "/hoje";

function ehRotaPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some(
    (rota) => caminho === rota || caminho.startsWith(`${rota}/`),
  );
}

/**
 * Renova a sessão do Supabase e aplica a proteção de rotas.
 *
 * O padrão de cookies abaixo é o recomendado pelo @supabase/ssr: os cookies
 * atualizados precisam ser gravados tanto na request (para o resto do
 * pipeline) quanto na response (para o navegador).
 */
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = lerEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaDefinir: CookiesParaDefinir) {
          for (const { name, value } of cookiesParaDefinir) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesParaDefinir) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Não remova: getUser() é o que de fato revalida e renova o token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !ehRotaPublica(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/entrar" || pathname === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = ROTA_INICIAL;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
