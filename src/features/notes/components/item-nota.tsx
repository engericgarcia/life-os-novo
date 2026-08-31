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
import { excluirNota } from "@/features/notes/actions";
import { DialogoNota } from "@/features/notes/components/dialogo-nota";
import { formatarData, paraDataISO } from "@/lib/date";
import { type LinhaArea, type LinhaNota } from "@/types/database";

export function ItemNota({
  nota,
  areas,
}: {
  nota: LinhaNota;
  areas: LinhaArea[];
}) {
  const area = areas.find((item) => item.id === nota.area_id);

  return (
    <li className="border-border bg-card rounded-xl border px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="leading-snug font-medium">{nota.title}</p>

          {nota.content ? (
            <p className="text-muted-foreground mt-1 line-clamp-3 text-sm whitespace-pre-wrap">
              {nota.content}
            </p>
          ) : null}

          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {area ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                {area.name}
              </span>
            ) : null}

            <span>
              editada em {formatarData(paraDataISO(new Date(nota.updated_at)))}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label={`Ações da anotação ${nota.title}`}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DialogoNota areas={areas} nota={nota}>
              <DropdownMenuItem onSelect={(evento) => evento.preventDefault()}>
                <Pencil />
                Editar
              </DropdownMenuItem>
            </DialogoNota>

            <DialogoConfirmacao
              titulo={`Excluir "${nota.title}"?`}
              descricao="Esta ação não pode ser desfeita."
              mensagemSucesso="Anotação excluída."
              acao={excluirNota}
              camposOcultos={{ id: nota.id }}
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
    </li>
  );
}
