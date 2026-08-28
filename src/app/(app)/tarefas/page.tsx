import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { listarAreas } from "@/features/areas/queries";
import { DialogoTarefa } from "@/features/tasks/components/dialogo-tarefa";
import { FiltrosTarefas } from "@/features/tasks/components/filtros-tarefas";
import { ItemTarefa } from "@/features/tasks/components/item-tarefa";
import { SEM_AREA } from "@/features/tasks/constants";
import { listarItensTarefas, type FiltroArea } from "@/features/tasks/queries";
import { hoje } from "@/lib/date";
import { type StatusTarefa } from "@/types/database";

export const metadata: Metadata = { title: "Tarefas" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A URL é entrada do usuário: só valores reconhecidos chegam à consulta. */
function lerFiltroArea(valor: string | undefined): FiltroArea {
  if (valor === SEM_AREA) return "sem-area";
  if (valor && UUID.test(valor)) return valor;
  return null;
}

export default async function PaginaTarefas({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; area?: string }>;
}) {
  const parametros = await searchParams;
  const status: StatusTarefa =
    parametros.status === "concluida" ? "concluida" : "pendente";
  const area = lerFiltroArea(parametros.area);

  const [areas, itens] = await Promise.all([
    listarAreas(),
    listarItensTarefas({ status, area }),
  ]);

  const hojeISO = hoje();

  return (
    <>
      <CabecalhoPagina
        titulo="Tarefas"
        descricao="Tudo o que você precisa fazer, num lugar só."
        acao={
          <DialogoTarefa areas={areas}>
            <Button size="sm">
              <Plus />
              Nova tarefa
            </Button>
          </DialogoTarefa>
        }
      />

      <FiltrosTarefas
        areas={areas}
        status={status}
        area={area === "sem-area" ? SEM_AREA : area}
      />

      {itens.length === 0 ? (
        <EstadoVazio
          titulo={
            status === "pendente"
              ? "Nenhuma tarefa pendente"
              : "Nada concluído por aqui ainda"
          }
          descricao={
            status === "pendente"
              ? "Crie uma tarefa para começar a organizar o seu dia."
              : "As tarefas que você concluir vão aparecer nesta lista."
          }
          acao={
            status === "pendente" ? (
              <DialogoTarefa areas={areas}>
                <Button size="sm">
                  <Plus />
                  Nova tarefa
                </Button>
              </DialogoTarefa>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {itens.map((item) => (
            <ItemTarefa
              key={item.chave}
              item={item}
              areas={areas}
              hoje={hojeISO}
            />
          ))}
        </ul>
      )}
    </>
  );
}
