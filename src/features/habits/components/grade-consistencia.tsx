import { diaDaSemana, formatarData, NOMES_CURTOS_DIAS } from "@/lib/date";
import { cn } from "@/lib/utils";

import { type DiaConsistencia } from "../streaks";

/**
 * Grade de consistência no estilo do gráfico de contribuições do GitHub.
 *
 * Sete linhas (domingo a sábado) e uma coluna por semana. Só o primeiro dia
 * precisa declarar a linha em que começa — o resto flui em coluna.
 */
export function GradeConsistencia({
  dias,
  cor,
}: {
  dias: DiaConsistencia[];
  cor: string;
}) {
  const primeiro = dias[0];

  if (!primeiro) return null;

  return (
    <div className="overflow-x-auto">
      <div
        className="grid grid-flow-col gap-1"
        style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
        role="img"
        aria-label={`Consistência dos últimos ${dias.length} dias`}
      >
        {dias.map((dia, indice) => (
          <div
            key={dia.data}
            title={`${formatarData(dia.data)} — ${
              dia.feito
                ? "cumprido"
                : dia.alvo
                  ? "não cumprido"
                  : "fora dos dias do hábito"
            }`}
            style={{
              ...(indice === 0
                ? { gridRowStart: diaDaSemana(dia.data) + 1 }
                : {}),
              ...(dia.feito ? { backgroundColor: cor } : {}),
            }}
            className={cn(
              "size-3 rounded-sm",
              !dia.feito && (dia.alvo ? "bg-muted" : "bg-muted/40"),
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Legenda dos dias-alvo do hábito. */
export function DiasAlvo({ dias }: { dias: number[] }) {
  if (dias.length === 7) return <span>Todo dia</span>;

  return (
    <span>
      {[...dias]
        .sort((a, b) => a - b)
        .map((dia) => NOMES_CURTOS_DIAS[dia])
        .join(", ")}
    </span>
  );
}
