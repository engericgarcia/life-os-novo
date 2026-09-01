import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { AlternadorTema } from "@/components/layout/alternador-tema";
import {
  NavegacaoInferior,
  NavegacaoLateral,
} from "@/components/layout/navegacao";
import { Button } from "@/components/ui/button";
import { BotaoSair } from "@/features/auth/components/botao-sair";
import { obterUsuario } from "@/lib/supabase/server";

export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  // O middleware já barra quem não tem sessão; esta checagem é a segunda
  // camada, para o caso de a rota ser alcançada por outro caminho.
  const usuario = await obterUsuario();

  if (!usuario) {
    redirect("/entrar");
  }

  return (
    <div className="min-h-dvh">
      <aside className="border-border bg-card/40 fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r p-4 md:flex">
        <div className="px-3 py-2">
          <p className="text-lg font-bold tracking-tight">life-os</p>
        </div>

        <div className="mt-4 flex-1">
          <NavegacaoLateral />
        </div>

        <div className="border-border flex items-center justify-between gap-2 border-t pt-3">
          <p
            className="text-muted-foreground truncate px-2 text-xs"
            title={usuario.email ?? undefined}
          >
            {usuario.email}
          </p>
          <div className="flex shrink-0 items-center">
            <AlternadorTema />
            <BotaoSair />
          </div>
        </div>
      </aside>

      <div className="md:pl-60">
        <header
          className="border-border bg-background/95 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:hidden"
          style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        >
          <p className="text-base font-bold tracking-tight">life-os</p>
          <div className="flex items-center">
            {/* Ajustes reúne o que é configuração — notificações e áreas —
                e sai da barra inferior, reservada ao uso diário. */}
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/ajustes" aria-label="Ajustes" title="Ajustes">
                <Settings className="size-4" />
              </Link>
            </Button>
            <AlternadorTema />
            <BotaoSair />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      <NavegacaoInferior />
    </div>
  );
}
