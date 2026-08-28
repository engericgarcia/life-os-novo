"use client";

import { Flame, MoreVertical, Pencil, Trash2, Trophy } from "lucide-react";

import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { excluirHabito } from "@/features/habits/actions";
import { BotaoCheckin } from "@/features/habits/components/botao-checkin";
import {
  DiasAlvo,
  GradeConsistencia,
} from "@/features/habits/components/grade-consistencia";
import { DialogoHabito } from "@/features/habits/components/dialogo-habito";
import { type HabitoComProgresso } from "@/features/habits/queries";
import { type DataISO } from "@/lib/date";

function plural(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

export function ItemHabito({
  habito,
  hoje,
}: {
  habito: HabitoComProgresso;
  hoje: DataISO;
}) {
  const { linha } = habito;

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <BotaoCheckin
          habitoId={linha.id}
          nome={linha.name}
          cor={linha.color}
          data={hoje}
          feito={habito.feitoHoje}
        />

        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{linha.name}</p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <DiasAlvo dias={habito.diasAlvo} />

            <span className="inline-flex items-center gap-1">
              <Flame className="size-3" />
              {plural(habito.streakAtual, "dia seguido", "dias seguidos")}
            </span>

            <span className="inline-flex items-center gap-1">
              <Trophy className="size-3" />
              melhor: {plural(habito.melhorStreak, "dia", "dias")}
            </span>

            {!habito.alvoHoje ? (
              <span className="italic">hoje não é dia deste hábito</span>
            ) : null}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label={`Ações do hábito ${linha.name}`}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DialogoHabito habito={linha}>
              <DropdownMenuItem onSelect={(evento) => evento.preventDefault()}>
                <Pencil />
                Editar
              </DropdownMenuItem>
            </DialogoHabito>

            <DialogoConfirmacao
              titulo={`Excluir "${linha.name}"?`}
              descricao="Todo o histórico de check-ins deste hábito será apagado."
              mensagemSucesso="Hábito excluído."
              acao={excluirHabito}
              camposOcultos={{ id: linha.id }}
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
      </div>

      <div className="mt-4">
        <GradeConsistencia dias={habito.grade} cor={linha.color} />
        <p className="mt-2 text-xs text-muted-foreground">Últimos 90 dias</p>
      </div>
    </li>
  );
}
