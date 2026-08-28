"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEM_AREA } from "@/features/tasks/constants";
import { cn } from "@/lib/utils";
import { type LinhaArea, type StatusTarefa } from "@/types/database";

const TODAS = "todas";

const ABAS: Array<{ valor: StatusTarefa; rotulo: string }> = [
  { valor: "pendente", rotulo: "Pendentes" },
  { valor: "concluida", rotulo: "Concluídas" },
];

/**
 * Os filtros vivem na URL: a página continua sendo um Server Component e o
 * estado é compartilhável e sobrevive ao recarregar.
 */
export function FiltrosTarefas({
  areas,
  status,
  area,
}: {
  areas: LinhaArea[];
  status: StatusTarefa;
  area: string | null;
}) {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();

  function navegar(chave: string, valor: string | null) {
    const novos = new URLSearchParams(parametros.toString());

    if (valor === null) {
      novos.delete(chave);
    } else {
      novos.set(chave, valor);
    }

    const consulta = novos.toString();

    router.push(consulta ? `${caminho}?${consulta}` : caminho);
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="tablist"
        aria-label="Filtrar por status"
        className="inline-flex rounded-lg border border-border p-1"
      >
        {ABAS.map((aba) => (
          <button
            key={aba.valor}
            type="button"
            role="tab"
            aria-selected={status === aba.valor}
            onClick={() =>
              navegar("status", aba.valor === "pendente" ? null : aba.valor)
            }
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              status === aba.valor
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      <Select
        value={area ?? TODAS}
        onValueChange={(valor) => navegar("area", valor === TODAS ? null : valor)}
      >
        <SelectTrigger className="sm:w-52" aria-label="Filtrar por área">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todas as áreas</SelectItem>
          <SelectItem value={SEM_AREA}>Sem área</SelectItem>
          {areas.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
