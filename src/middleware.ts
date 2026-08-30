import { type NextRequest } from "next/server";

import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: [
    /*
     * Todas as rotas, exceto:
     * - estáticos e imagens, que não precisam de sessão e só encareceriam
     *   cada navegação;
     * - os arquivos do PWA (sw.js, offline.html, manifest.webmanifest). Sem
     *   esta exceção, o service worker guardaria a tela de login redirecionada
     *   no lugar da página offline.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
