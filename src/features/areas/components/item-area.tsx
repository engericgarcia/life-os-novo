"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { DialogoConfirmacao } from "@/components/dialogo-confirmacao";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { excluirArea } from "@/features/areas/actions";
import { DialogoArea } from "@/features/areas/components/dialogo-area";
import { type LinhaArea } from "@/types/database";

export function ItemArea({ area }: { area: LinhaArea }) {
  return (
    <li className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
      <span
        aria-hidden
        className="size-3.5 shrink-0 rounded-full"
        style={{ backgroundColor: area.color }}
      />

      <span className="min-w-0 flex-1 truncate font-medium">{area.name}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações da área ${area.name}`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DialogoArea area={area}>
            <DropdownMenuItem onSelect={(evento) => evento.preventDefault()}>
              <Pencil />
              Editar
            </DropdownMenuItem>
          </DialogoArea>

          <DialogoConfirmacao
            titulo={`Excluir "${area.name}"?`}
            descricao="As tarefas desta área não serão apagadas — elas ficarão sem área."
            mensagemSucesso="Área excluída."
            acao={excluirArea}
            camposOcultos={{ id: area.id }}
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
    </li>
  );
}
