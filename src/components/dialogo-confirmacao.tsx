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
import { type EstadoAcao, type ResultadoAcao } from "@/lib/errors";

type AcaoConfirmavel = (
  estadoAnterior: EstadoAcao,
  formData: FormData,
) => Promise<ResultadoAcao>;

/**
 * Diálogo de confirmação para ações destrutivas. Recebe a Server Action e os
 * campos ocultos que ela precisa (normalmente o id).
 */
export function DialogoConfirmacao({
  titulo,
  descricao,
  rotuloConfirmar = "Excluir",
  mensagemSucesso,
  acao,
  camposOcultos,
  children,
}: {
  titulo: string;
  descricao: string;
  rotuloConfirmar?: string;
  mensagemSucesso: string;
  acao: AcaoConfirmavel;
  camposOcultos: Record<string, string>;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = React.useState(false);
  const [estado, enviar, pendente] = React.useActionState(acao, null);

  React.useEffect(() => {
    if (!estado) return;

    if (estado.ok) {
      setAberto(false);
      toast.success(mensagemSucesso);
    } else {
      toast.error(estado.erro);
    }
  }, [estado, mensagemSucesso]);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <form action={enviar} className="contents">
          {Object.entries(camposOcultos).map(([nome, valor]) => (
            <input key={nome} type="hidden" name={nome} value={valor} />
          ))}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={pendente}>
              {pendente ? <Loader2 className="animate-spin" /> : null}
              {rotuloConfirmar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
