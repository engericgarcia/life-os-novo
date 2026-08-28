"use client";

import * as React from "react";

import { NOMES_CURTOS_DIAS, NOMES_DIAS } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * Seleção de dias da semana (0 = domingo … 6 = sábado).
 *
 * Emite um `<input type="hidden">` por dia marcado, então funciona dentro de
 * qualquer `<form>` com Server Action.
 */
export function SeletorDiasSemana({
  name,
  valorInicial = [],
}: {
  name: string;
  valorInicial?: number[];
}) {
  const [dias, setDias] = React.useState<number[]>(valorInicial);

  function alternar(dia: number) {
    setDias((atual) =>
      atual.includes(dia)
        ? atual.filter((valor) => valor !== dia)
        : [...atual, dia],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {NOMES_CURTOS_DIAS.map((rotulo, dia) => {
        const ativo = dias.includes(dia);

        return (
          <button
            key={rotulo}
            type="button"
            role="checkbox"
            aria-checked={ativo}
            aria-label={NOMES_DIAS[dia]}
            onClick={() => alternar(dia)}
            className={cn(
              "h-10 min-w-11 rounded-md border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              ativo
                ? "border-primary bg-primary/15 text-primary"
                : "border-input text-muted-foreground hover:bg-accent",
            )}
          >
            {rotulo}
          </button>
        );
      })}

      {dias.map((dia) => (
        <input key={dia} type="hidden" name={name} value={dia} />
      ))}
    </div>
  );
}
