import Link from "next/link";

import { BotaoCheckin } from "@/features/habits/components/botao-checkin";
import { type HabitoComProgresso } from "@/features/habits/queries";
import { type DataISO } from "@/lib/date";
import { cn } from "@/lib/utils";

export function HabitosDoDia({
  habitos,
  hoje,
}: {
  habitos: HabitoComProgresso[];
  hoje: DataISO;
}) {
  if (habitos.length === 0) {
    return (
      <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
        Nenhum hábito para hoje.{" "}
        <Link href="/habitos" className="text-primary hover:underline">
          Criar um hábito
        </Link>
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {habitos.map(({ linha, feitoHoje, streakAtual }) => (
        <li
          key={linha.id}
          className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <BotaoCheckin
            habitoId={linha.id}
            nome={linha.name}
            cor={linha.color}
            data={hoje}
            feito={feitoHoje}
            tamanho="pequeno"
          />

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-medium",
                feitoHoje && "text-muted-foreground line-through",
              )}
            >
              {linha.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {streakAtual > 0
                ? `${streakAtual} ${streakAtual === 1 ? "dia seguido" : "dias seguidos"}`
                : "comece a sequência hoje"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
