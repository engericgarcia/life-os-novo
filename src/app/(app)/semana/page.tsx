import type { Metadata } from "next";
import { Plus, TriangleAlert } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Button } from "@/components/ui/button";
import { listarAreas } from "@/features/areas/queries";
import { DiaDaSemana } from "@/features/tasks/components/dia-da-semana";
import { DialogoTarefa } from "@/features/tasks/components/dialogo-tarefa";
import { ItemTarefa } from "@/features/tasks/components/item-tarefa";
import { listarSemana } from "@/features/tasks/queries";
import { formatarData, hoje, somarDias } from "@/lib/date";

export const metadata: Metadata = { title: "Semana" };

const DIAS = 7;

export default async function PaginaSemana() {
  const hojeISO = hoje();

  const [{ atrasadas, semana }, areas] = await Promise.all([
    listarSemana(hojeISO, DIAS),
    listarAreas(),
  ]);

  const fim = somarDias(hojeISO, DIAS - 1);
  const total = semana.reduce((soma, dia) => soma + dia.itens.length, 0);

  return (
    <>
      <CabecalhoPagina
        titulo="Semana"
        descricao={`${formatarData(hojeISO).slice(0, 5)} a ${formatarData(fim).slice(0, 5)} · ${total} ${total === 1 ? "tarefa" : "tarefas"}`}
        acao={
          <DialogoTarefa areas={areas} dataPadrao={hojeISO}>
            <Button size="sm">
              <Plus />
              Nova tarefa
            </Button>
          </DialogoTarefa>
        }
      />

      {atrasadas.length > 0 ? (
        <section className="mb-8">
          <div className="text-destructive mb-2 flex items-center gap-2">
            <TriangleAlert className="size-4" />
            <h2 className="text-sm font-semibold">
              Atrasadas ({atrasadas.length})
            </h2>
          </div>

          <ul className="flex flex-col gap-2">
            {atrasadas.map((item) => (
              <ItemTarefa
                key={item.chave}
                item={item}
                areas={areas}
                hoje={hojeISO}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-6">
        {semana.map((dia) => (
          <DiaDaSemana key={dia.data} dia={dia} areas={areas} hoje={hojeISO} />
        ))}
      </div>
    </>
  );
}
