"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Paleta fixa: evita cores ilegíveis e mantém a interface coerente. */
export const CORES = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#64748b",
] as const;

export const COR_PADRAO = CORES[0];

export function SeletorCor({
  name,
  valorInicial = COR_PADRAO,
}: {
  name: string;
  valorInicial?: string;
}) {
  const [selecionada, setSelecionada] = React.useState(valorInicial);

  return (
    <div role="radiogroup" aria-label="Cor" className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={selecionada} />

      {CORES.map((cor) => {
        const ativa = cor.toLowerCase() === selecionada.toLowerCase();

        return (
          <button
            key={cor}
            type="button"
            role="radio"
            aria-checked={ativa}
            aria-label={`Cor ${cor}`}
            onClick={() => setSelecionada(cor)}
            style={{ backgroundColor: cor }}
            className={cn(
              "focus-visible:ring-ring focus-visible:ring-offset-background flex size-8 items-center justify-center rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              ativa ? "scale-110" : "hover:scale-105",
            )}
          >
            {ativa ? (
              <Check
                className="size-4 text-white drop-shadow"
                strokeWidth={3}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
