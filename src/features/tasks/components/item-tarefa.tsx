"use client";

import { MoreVertical, Pencil, Repeat2, Trash2 } from "lucide-react";

import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { excluirTarefa } from "@/features/tasks/actions";
import { CaixaConclusao } from "@/features/tasks/components/caixa-conclusao";
import { DialogoTarefa } from "@/features/tasks/components/dialogo-tarefa";
import { descreverRecorrencia } from "@/features/tasks/recurrence";
import {
  ROTULOS_PRIORIDADE,
  type ItemTarefa as TipoItemTarefa,
} from "@/features/tasks/types";
import { rotuloRelativo, type DataISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { type LinhaArea } from "@/types/database";

export function ItemTarefa({
  item,
  areas,
  hoje,
}: {
  item: TipoItemTarefa;
  areas: LinhaArea[];
  hoje: DataISO;
}) {
  const concluida = item.status === "concluida";
  const atrasada =
    !concluida && item.dataVencimento !== null && item.dataVencimento < hoje;

  return (
    <li className="border-border bg-card flex items-start gap-3 rounded-xl border px-4 py-3">
      <div className="pt-0.5">
        <CaixaConclusao item={item} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "leading-snug font-medium",
            concluida && "text-muted-foreground line-through",
          )}
        >
          {item.titulo}
        </p>

        {item.descricao ? (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
            {item.descricao}
          </p>
        ) : null}

        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {item.area ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: item.area.cor }}
              />
              {item.area.nome}
            </span>
          ) : null}

          {item.dataVencimento ? (
            <span className={cn(atrasada && "text-destructive font-medium")}>
              {rotuloRelativo(item.dataVencimento, hoje)}
            </span>
          ) : null}

          {item.prioridade !== "media" ? (
            <span
              className={cn(
                item.prioridade === "alta" &&
                  "font-medium text-amber-600 dark:text-amber-400",
              )}
            >
              Prioridade {ROTULOS_PRIORIDADE[item.prioridade].toLowerCase()}
            </span>
          ) : null}

          {item.recorrencia ? (
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="size-3" />
              {descreverRecorrencia(item.recorrencia)}
            </span>
          ) : null}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-label={`Ações da tarefa ${item.titulo}`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DialogoTarefa areas={areas} tarefa={item.tarefa}>
            <DropdownMenuItem onSelect={(evento) => evento.preventDefault()}>
              <Pencil />
              Editar
            </DropdownMenuItem>
          </DialogoTarefa>

          <DialogoConfirmacao
            titulo={`Excluir "${item.titulo}"?`}
            descricao={
              item.recorrencia
                ? "A tarefa e todo o histórico de repetições serão apagados."
                : "Esta ação não pode ser desfeita."
            }
            mensagemSucesso="Tarefa excluída."
            acao={excluirTarefa}
            camposOcultos={{ id: item.tarefaId }}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(evento) => evento.preventDefault()}
            >
              <Trash2 />
              Excluir
            </DropdownMenuItem>
          </DialogoConfirmacao>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
