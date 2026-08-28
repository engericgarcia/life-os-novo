"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { COR_PADRAO, SeletorCor } from "@/components/seletor-cor";
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
import { atualizarArea, criarArea } from "@/features/areas/actions";
import { type LinhaArea } from "@/types/database";

/**
 * Cria ou edita uma área. Sem `area`, é criação; com `area`, edição.
 */
export function DialogoArea({
  area,
  children,
}: {
  area?: LinhaArea;
  children: React.ReactNode;
}) {
  const editando = Boolean(area);
  const [aberto, setAberto] = React.useState(false);
  const [estado, enviar, pendente] = React.useActionState(
    editando ? atualizarArea : criarArea,
    null,
  );

  React.useEffect(() => {
    if (estado?.ok) {
      setAberto(false);
      toast.success(editando ? "Área atualizada." : "Área criada.");
    }
  }, [estado, editando]);

  const erroNome =
    estado?.ok === false ? estado.errosPorCampo?.nome?.[0] : undefined;
  const erroGeral =
    estado?.ok === false && !estado.errosPorCampo ? estado.erro : undefined;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar área" : "Nova área"}</DialogTitle>
          <DialogDescription>
            Áreas agrupam suas tarefas — por exemplo Trabalho, Faculdade ou
            Pessoal.
          </DialogDescription>
        </DialogHeader>

        <form action={enviar} className="flex flex-col gap-4">
          {area ? <input type="hidden" name="id" value={area.id} /> : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-area">Nome</Label>
            <Input
              id="nome-area"
              name="nome"
              defaultValue={area?.name ?? ""}
              placeholder="Trabalho"
              maxLength={60}
              autoFocus
              aria-invalid={Boolean(erroNome)}
            />
            {erroNome ? (
              <p className="text-destructive text-sm">{erroNome}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cor</Label>
            <SeletorCor name="cor" valorInicial={area?.color ?? COR_PADRAO} />
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
              {editando ? "Salvar" : "Criar área"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
