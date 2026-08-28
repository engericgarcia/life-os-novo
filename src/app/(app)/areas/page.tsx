import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { DialogoArea } from "@/features/areas/components/dialogo-area";
import { ItemArea } from "@/features/areas/components/item-area";
import { listarAreas } from "@/features/areas/queries";

export const metadata: Metadata = { title: "Áreas" };

export default async function PaginaAreas() {
  const areas = await listarAreas();

  return (
    <>
      <CabecalhoPagina
        titulo="Áreas"
        descricao="Os agrupadores das suas tarefas."
        acao={
          <DialogoArea>
            <Button size="sm">
              <Plus />
              Nova área
            </Button>
          </DialogoArea>
        }
      />

      {areas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma área ainda"
          descricao="Crie áreas como Trabalho, Faculdade ou Pessoal para organizar suas tarefas."
          acao={
            <DialogoArea>
              <Button size="sm">
                <Plus />
                Nova área
              </Button>
            </DialogoArea>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {areas.map((area) => (
            <ItemArea key={area.id} area={area} />
          ))}
        </ul>
      )}
    </>
  );
}
