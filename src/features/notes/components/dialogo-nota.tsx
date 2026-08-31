"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { atualizarNota, criarNota } from "@/features/notes/actions";
import { SEM_AREA } from "@/features/tasks/constants";
import { type LinhaArea, type LinhaNota } from "@/types/database";

export function DialogoNota({
  areas,
  nota,
  children,
}: {
  areas: LinhaArea[];
  nota?: LinhaNota;
  children: React.ReactNode;
}) {
  const editando = Boolean(nota);
  const [aberto, setAberto] = React.useState(false);
  const [estado, enviar, pendente] = React.useActionState(
    editando ? atualizarNota : criarNota,
    null,
  );

  React.useEffect(() => {
    if (estado?.ok) {
      setAberto(false);
      toast.success(editando ? "Anotação salva." : "Anotação criada.");
    }
  }, [estado, editando]);

  const erros = estado?.ok === false ? estado.errosPorCampo : undefined;
  const erroGeral =
    estado?.ok === false && !estado.errosPorCampo ? estado.erro : undefined;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar anotação" : "Nova anotação"}
          </DialogTitle>
          <DialogDescription>
            Para o que não é tarefa: ideias, listas, links, lembretes.
          </DialogDescription>
        </DialogHeader>

        <form action={enviar} className="flex flex-col gap-4">
          {nota ? <input type="hidden" name="id" value={nota.id} /> : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo-nota">Título</Label>
            <Input
              id="titulo-nota"
              name="titulo"
              defaultValue={nota?.title ?? ""}
              placeholder="Livros para ler"
              maxLength={140}
              autoFocus
              aria-invalid={Boolean(erros?.titulo)}
            />
            {erros?.titulo?.[0] ? (
              <p className="text-destructive text-sm">{erros.titulo[0]}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="conteudo-nota">Conteúdo</Label>
            <Textarea
              id="conteudo-nota"
              name="conteudo"
              defaultValue={nota?.content ?? ""}
              placeholder="Escreva à vontade"
              rows={8}
              maxLength={20000}
              aria-invalid={Boolean(erros?.conteudo)}
            />
            {erros?.conteudo?.[0] ? (
              <p className="text-destructive text-sm">{erros.conteudo[0]}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="areaId-nota">Área</Label>
            <Select name="areaId" defaultValue={nota?.area_id ?? SEM_AREA}>
              <SelectTrigger id="areaId-nota">
                <SelectValue placeholder="Sem área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_AREA}>Sem área</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {erroGeral ? (
            <p role="alert" className="text-destructive text-sm">
              {erroGeral}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? <Loader2 className="animate-spin" /> : null}
              {editando ? "Salvar" : "Criar anotação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
