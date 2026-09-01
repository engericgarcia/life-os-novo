import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { ControleNotificacoes } from "@/features/notifications/components/controle-notificacoes";
import { FormularioPreferencias } from "@/features/notifications/components/formulario-preferencias";
import { obterEstadoNotificacoes } from "@/features/notifications/queries";
import { lerChavePublicaPush } from "@/lib/env";

export const metadata: Metadata = { title: "Ajustes" };

export default async function PaginaAjustes() {
  const { preferencias, aparelhos } = await obterEstadoNotificacoes();
  const chavePublica = lerChavePublicaPush();

  return (
    <>
      <CabecalhoPagina titulo="Ajustes" />

      <section className="border-border bg-card mb-6 rounded-xl border p-5">
        <h2 className="font-semibold">Notificações</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          {aparelhos === 0
            ? "Nenhum aparelho inscrito."
            : `${aparelhos} ${aparelhos === 1 ? "aparelho inscrito" : "aparelhos inscritos"}.`}
        </p>

        <ControleNotificacoes chavePublica={chavePublica} />

        <div className="border-border mt-5 border-t pt-5">
          <FormularioPreferencias
            ativadoInicial={preferencias.enabled}
            horaInicial={preferencias.send_hour}
          />
        </div>
      </section>

      <Link
        href="/areas"
        className="border-border bg-card hover:bg-accent flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
      >
        <FolderOpen className="text-muted-foreground size-4 shrink-0" />
        <span className="flex-1 font-medium">Áreas</span>
        <ChevronRight className="text-muted-foreground size-4" />
      </Link>
    </>
  );
}
