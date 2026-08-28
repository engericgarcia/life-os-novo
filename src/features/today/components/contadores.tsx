import { CheckCircle2, Flame, ListTodo } from "lucide-react";

import { cn } from "@/lib/utils";

function Contador({
  rotulo,
  valor,
  detalhe,
  Icone,
  destaque,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  Icone: typeof Flame;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icone className={cn("size-3.5", destaque && "text-orange-400")} />
        {rotulo}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {detalhe ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>
      ) : null}
    </div>
  );
}

export function Contadores({
  concluidasHoje,
  pendentes,
  atrasadas,
  sequenciaAtiva,
  habitosFeitos,
  totalHabitos,
}: {
  concluidasHoje: number;
  pendentes: number;
  atrasadas: number;
  sequenciaAtiva: number;
  habitosFeitos: number;
  totalHabitos: number;
}) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      <Contador
        rotulo="Concluídas"
        valor={String(concluidasHoje)}
        detalhe="hoje"
        Icone={CheckCircle2}
      />
      <Contador
        rotulo="Pendentes"
        valor={String(pendentes)}
        detalhe={atrasadas > 0 ? `${atrasadas} atrasada(s)` : "em dia"}
        Icone={ListTodo}
      />
      <Contador
        rotulo="Sequência"
        valor={String(sequenciaAtiva)}
        detalhe={
          totalHabitos > 0
            ? `${habitosFeitos}/${totalHabitos} hábitos`
            : "sem hábitos"
        }
        Icone={Flame}
        destaque={sequenciaAtiva > 0}
      />
    </div>
  );
}
