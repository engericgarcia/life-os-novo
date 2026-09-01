"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salvarPreferencias } from "@/features/notifications/actions";

const HORAS = Array.from({ length: 24 }, (_, hora) => hora);

export function FormularioPreferencias({
  ativadoInicial,
  horaInicial,
}: {
  ativadoInicial: boolean;
  horaInicial: number;
}) {
  const [ativado, setAtivado] = React.useState(ativadoInicial);
  const [estado, enviar, pendente] = React.useActionState(
    salvarPreferencias,
    null,
  );

  React.useEffect(() => {
    if (!estado) return;

    if (estado.ok) {
      toast.success("Preferências salvas.");
    } else {
      toast.error(estado.erro);
    }
  }, [estado]);

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <input type="hidden" name="ativado" value={ativado ? "1" : "0"} />

      <div className="flex items-start gap-3">
        <Checkbox
          id="ativado"
          checked={ativado}
          onCheckedChange={(valor) => setAtivado(valor === true)}
        />
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="ativado">Receber o resumo do dia</Label>
          <p className="text-muted-foreground text-xs">
            Uma notificação por dia com o que vence hoje e os hábitos pendentes.
            Se não houver nada, nada é enviado.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="horaDeEnvio">Horário</Label>
        <Select name="horaDeEnvio" defaultValue={String(horaInicial)}>
          <SelectTrigger id="horaDeEnvio" className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HORAS.map((hora) => (
              <SelectItem key={hora} value={String(hora)}>
                {String(hora).padStart(2, "0")}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Horário de Brasília. O envio acontece na hora cheia mais próxima.
        </p>
      </div>

      <Button type="submit" disabled={pendente} className="self-start">
        {pendente ? <Loader2 className="animate-spin" /> : null}
        Salvar
      </Button>
    </form>
  );
}
