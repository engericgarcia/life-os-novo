import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { listarAreas } from "@/features/areas/queries";
import { DialogoNota } from "@/features/notes/components/dialogo-nota";
import { ItemNota } from "@/features/notes/components/item-nota";
import { listarNotas } from "@/features/notes/queries";

export const metadata: Metadata = { title: "Anotações" };

export default async function PaginaAnotacoes() {
  const [notas, areas] = await Promise.all([listarNotas(), listarAreas()]);

  const botaoNova = (
    <DialogoNota areas={areas}>
      <Button size="sm">
        <Plus />
        Nova anotação
      </Button>
    </DialogoNota>
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Anotações"
        descricao="O que não é tarefa, mas você não quer esquecer."
        acao={botaoNova}
      />

      {notas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma anotação ainda"
          descricao="Ideias, listas, links, trechos de aula — o que não cabe numa tarefa cabe aqui."
          acao={botaoNova}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {notas.map((nota) => (
            <ItemNota key={nota.id} nota={nota} areas={areas} />
          ))}
        </ul>
      )}
    </>
  );
}
