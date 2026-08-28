import { type NextRequest } from "next/server";

import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: [
    /*
     * Todas as rotas, exceto arquivos estáticos e imagens — que não precisam
     * de sessão e só encareceriam cada navegação.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
