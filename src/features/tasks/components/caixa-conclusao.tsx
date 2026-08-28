"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { alternarConclusao } from "@/features/tasks/actions";
import { type ItemTarefa } from "@/features/tasks/types";
import { cn } from "@/lib/utils";

/**
 * Caixa de conclusão da tarefa.
 *
 * É um `<form>` com Server Action — e não um checkbox com onChange — porque
 * concluir é uma mutação: funciona sem JavaScript e revalida a página sozinho.
 */
export function CaixaConclusao({ item }: { item: ItemTarefa }) {
  const [estado, enviar, pendente] = React.useActionState(
    alternarConclusao,
    null,
  );

  React.useEffect(() => {
    if (estado?.ok === false) {
      toast.error(estado.erro);
    }
  }, [estado]);

  const concluida = item.status === "concluida";

  return (
    <form action={enviar} className="flex shrink-0 items-center">
      <input type="hidden" name="tarefaId" value={item.tarefaId} />
      {item.ocorrenciaId ? (
        <input type="hidden" name="ocorrenciaId" value={item.ocorrenciaId} />
      ) : null}
      <input type="hidden" name="concluir" value={concluida ? "0" : "1"} />

      <button
        type="submit"
        role="checkbox"
        aria-checked={concluida}
        aria-label={
          concluida
            ? `Reabrir "${item.titulo}"`
            : `Concluir "${item.titulo}"`
        }
        disabled={pendente}
        className={cn(
          "flex size-6 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
          concluida
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-primary",
        )}
      >
        {pendente ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : concluida ? (
          <Check className="size-4" strokeWidth={3} />
        ) : null}
      </button>
    </form>
  );
}
