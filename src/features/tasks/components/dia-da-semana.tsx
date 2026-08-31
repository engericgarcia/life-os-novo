import { ItemTarefa } from "@/features/tasks/components/item-tarefa";
import { type DiaDaSemana as TipoDia } from "@/features/tasks/queries";
import {
  diaDaSemana,
  formatarData,
  NOMES_DIAS,
  rotuloRelativo,
  type DataISO,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { type LinhaArea } from "@/types/database";

/** Um dia da visão da semana, com as tarefas que vencem nele. */
export function DiaDaSemana({
  dia,
  areas,
  hoje,
}: {
  dia: TipoDia;
  areas: LinhaArea[];
  hoje: DataISO;
}) {
  const ehHoje = dia.data === hoje;
  const nomeDoDia = NOMES_DIAS[diaDaSemana(dia.data)];
  const fimDeSemana = [0, 6].includes(diaDaSemana(dia.data));

  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2">
        <h2
          className={cn(
            "text-sm font-semibold",
            ehHoje ? "text-primary" : fimDeSemana && "text-muted-foreground",
          )}
        >
          {ehHoje ? "Hoje" : rotuloRelativo(dia.data, hoje)}
        </h2>
        <span className="text-muted-foreground text-xs">
          {ehHoje ? nomeDoDia : null} {formatarData(dia.data).slice(0, 5)}
        </span>
        {dia.itens.length > 0 ? (
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {dia.itens.length}
          </span>
        ) : null}
      </div>

      {dia.itens.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm">
          Nada previsto.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dia.itens.map((item) => (
            <ItemTarefa
              key={item.chave}
              item={item}
              areas={areas}
              hoje={hoje}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
