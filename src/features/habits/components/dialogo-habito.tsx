"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SeletorCor } from "@/components/seletor-cor";
import { SeletorDiasSemana } from "@/components/seletor-dias-semana";
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
import { atualizarHabito, criarHabito } from "@/features/habits/actions";
import { type LinhaHabito } from "@/types/database";

const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];
const COR_PADRAO_HABITO = "#22c55e";

export function DialogoHabito({
  habito,
  children,
}: {
  habito?: LinhaHabito;
  children: React.ReactNode;
}) {
  const editando = Boolean(habito);
  const [aberto, setAberto] = React.useState(false);
  const [estado, enviar, pendente] = React.useActionState(
    editando ? atualizarHabito : criarHabito,
    null,
  );

  React.useEffect(() => {
    if (estado?.ok) {
      setAberto(false);
      toast.success(editando ? "Hábito atualizado." : "Hábito criado.");
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
          <DialogTitle>{editando ? "Editar hábito" : "Novo hábito"}</DialogTitle>
          <DialogDescription>
            Escolha os dias em que o hábito deve ser cumprido — os outros dias
            não contam contra a sua sequência.
          </DialogDescription>
        </DialogHeader>

        <form action={enviar} className="flex flex-col gap-4">
          {habito ? <input type="hidden" name="id" value={habito.id} /> : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-habito">Nome</Label>
            <Input
              id="nome-habito"
              name="nome"
              defaultValue={habito?.name ?? ""}
              placeholder="Ler 20 páginas"
              maxLength={60}
              autoFocus
              aria-invalid={Boolean(erros?.nome)}
            />
            {erros?.nome?.[0] ? (
              <p className="text-sm text-destructive">{erros.nome[0]}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Dias do hábito</Label>
            <SeletorDiasSemana
              name="diasAlvo"
              valorInicial={habito?.target_weekdays ?? TODOS_OS_DIAS}
            />
            {erros?.diasAlvo?.[0] ? (
              <p className="text-sm text-destructive">{erros.diasAlvo[0]}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cor</Label>
            <SeletorCor
              name="cor"
              valorInicial={habito?.color ?? COR_PADRAO_HABITO}
            />
          </div>

          {erroGeral ? (
            <p role="alert" className="text-sm text-destructive">
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
              {editando ? "Salvar" : "Criar hábito"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
