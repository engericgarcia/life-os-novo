"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { alternarCheckin } from "@/features/habits/actions";
import { type DataISO } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Botão de check-in do dia. Um `<form>` com Server Action, não um toggle local. */
export function BotaoCheckin({
  habitoId,
  nome,
  cor,
  data,
  feito,
  tamanho = "grande",
}: {
  habitoId: string;
  nome: string;
  cor: string;
  data: DataISO;
  feito: boolean;
  tamanho?: "grande" | "pequeno";
}) {
  const [estado, enviar, pendente] = React.useActionState(
    alternarCheckin,
    null,
  );

  React.useEffect(() => {
    if (estado?.ok === false) {
      toast.error(estado.erro);
    }
  }, [estado]);

  return (
    <form action={enviar} className="shrink-0">
      <input type="hidden" name="habitoId" value={habitoId} />
      <input type="hidden" name="data" value={data} />
      <input type="hidden" name="marcar" value={feito ? "0" : "1"} />

      <button
        type="submit"
        role="checkbox"
        aria-checked={feito}
        aria-label={feito ? `Desfazer "${nome}"` : `Marcar "${nome}"`}
        disabled={pendente}
        style={feito ? { backgroundColor: cor, borderColor: cor } : undefined}
        className={cn(
          "focus-visible:ring-ring flex items-center justify-center rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60",
          tamanho === "grande" ? "size-10" : "size-8",
          feito ? "text-white" : "border-input hover:border-primary",
        )}
      >
        {pendente ? (
          <Loader2 className="size-4 animate-spin" />
        ) : feito ? (
          <Check
            className={tamanho === "grande" ? "size-5" : "size-4"}
            strokeWidth={3}
          />
        ) : null}
      </button>
    </form>
  );
}
