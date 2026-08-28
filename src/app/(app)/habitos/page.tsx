import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { DialogoHabito } from "@/features/habits/components/dialogo-habito";
import { ItemHabito } from "@/features/habits/components/item-habito";
import { listarHabitosComProgresso } from "@/features/habits/queries";
import { hoje } from "@/lib/date";

export const metadata: Metadata = { title: "Hábitos" };

export default async function PaginaHabitos() {
  const hojeISO = hoje();
  const habitos = await listarHabitosComProgresso(hojeISO);

  return (
    <>
      <CabecalhoPagina
        titulo="Hábitos"
        descricao="O que você quer manter, dia após dia."
        acao={
          <DialogoHabito>
            <Button size="sm">
              <Plus />
              Novo hábito
            </Button>
          </DialogoHabito>
        }
      />

      {habitos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum hábito ainda"
          descricao="Crie um hábito, escolha os dias da semana e comece a construir sua sequência."
          acao={
            <DialogoHabito>
              <Button size="sm">
                <Plus />
                Novo hábito
              </Button>
            </DialogoHabito>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {habitos.map((habito) => (
            <ItemHabito
              key={habito.linha.id}
              habito={habito}
              hoje={hojeISO}
            />
          ))}
        </ul>
      )}
    </>
  );
}
