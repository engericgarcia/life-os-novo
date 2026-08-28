import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Button } from "@/components/ui/button";
import { listarAreas } from "@/features/areas/queries";
import { DialogoTarefa } from "@/features/tasks/components/dialogo-tarefa";
import { ItemTarefa } from "@/features/tasks/components/item-tarefa";
import { Contadores } from "@/features/today/components/contadores";
import { HabitosDoDia } from "@/features/today/components/habitos-do-dia";
import { carregarVisaoDeHoje } from "@/features/today/queries";
import { formatarDataPorExtenso, hoje } from "@/lib/date";

export const metadata: Metadata = { title: "Hoje" };

export default async function PaginaHoje() {
  const hojeISO = hoje();

  const [{ tarefas, habitos, contadores }, areas] = await Promise.all([
    carregarVisaoDeHoje(hojeISO),
    listarAreas(),
  ]);

  return (
    <>
      <CabecalhoPagina
        titulo="Hoje"
        descricao={formatarDataPorExtenso(hojeISO)}
        acao={
          <DialogoTarefa areas={areas} dataPadrao={hojeISO}>
            <Button size="sm">
              <Plus />
              Nova tarefa
            </Button>
          </DialogoTarefa>
        }
      />

      <Contadores {...contadores} />

      <section className="mb-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tarefas
          </h2>
          <Link
            href="/tarefas"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Ver todas
          </Link>
        </div>

        {tarefas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nada vencendo hoje. Dia limpo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tarefas.map((item) => (
              <ItemTarefa
                key={item.chave}
                item={item}
                areas={areas}
                hoje={hojeISO}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Hábitos de hoje
          </h2>
          <Link
            href="/habitos"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Ver todos
          </Link>
        </div>

        <HabitosDoDia habitos={habitos} hoje={hojeISO} />
      </section>
    </>
  );
}
