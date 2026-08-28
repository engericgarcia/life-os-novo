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
import { atualizarTarefa, criarTarefa } from "@/features/tasks/actions";
import { SEM_AREA } from "@/features/tasks/constants";
import { ROTULOS_PRIORIDADE, PRIORIDADES } from "@/features/tasks/types";
import { NOMES_CURTOS_DIAS } from "@/lib/date";
import { cn } from "@/lib/utils";
import { type LinhaArea, type LinhaTarefa } from "@/types/database";

type OpcaoRepeticao = "nenhuma" | "diaria" | "semanal" | "mensal";

const ROTULOS_REPETICAO: Record<OpcaoRepeticao, string> = {
  nenhuma: "Não repete",
  diaria: "Todo dia",
  semanal: "Dias da semana",
  mensal: "Todo mês, em dia fixo",
};

export function DialogoTarefa({
  areas,
  tarefa,
  dataPadrao,
  children,
}: {
  areas: LinhaArea[];
  tarefa?: LinhaTarefa;
  /** Preenche o vencimento ao criar a partir da visão "Hoje". */
  dataPadrao?: string;
  children: React.ReactNode;
}) {
  const editando = Boolean(tarefa);
  const [aberto, setAberto] = React.useState(false);
  const [repeticao, setRepeticao] = React.useState<OpcaoRepeticao>(
    tarefa?.recurrence ?? "nenhuma",
  );
  const [diasDaSemana, setDiasDaSemana] = React.useState<number[]>(
    tarefa?.recurrence_weekdays ?? [],
  );

  const [estado, enviar, pendente] = React.useActionState(
    editando ? atualizarTarefa : criarTarefa,
    null,
  );

  React.useEffect(() => {
    if (estado?.ok) {
      setAberto(false);
      toast.success(editando ? "Tarefa atualizada." : "Tarefa criada.");
    }
  }, [estado, editando]);

  const erros = estado?.ok === false ? estado.errosPorCampo : undefined;
  const erroGeral =
    estado?.ok === false && !estado.errosPorCampo ? estado.erro : undefined;

  function alternarDia(dia: number) {
    setDiasDaSemana((atual) =>
      atual.includes(dia)
        ? atual.filter((valor) => valor !== dia)
        : [...atual, dia],
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Alterações na repetição valem a partir da próxima ocorrência."
              : "Só o título é obrigatório."}
          </DialogDescription>
        </DialogHeader>

        <form action={enviar} className="flex flex-col gap-4">
          {tarefa ? <input type="hidden" name="id" value={tarefa.id} /> : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              defaultValue={tarefa?.title ?? ""}
              placeholder="Estudar cálculo"
              maxLength={140}
              autoFocus
              aria-invalid={Boolean(erros?.titulo)}
            />
            {erros?.titulo?.[0] ? (
              <p className="text-sm text-destructive">{erros.titulo[0]}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              name="descricao"
              defaultValue={tarefa?.description ?? ""}
              placeholder="Opcional"
              maxLength={2000}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="areaId">Área</Label>
              <Select
                name="areaId"
                defaultValue={tarefa?.area_id ?? SEM_AREA}
              >
                <SelectTrigger id="areaId">
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                name="prioridade"
                defaultValue={tarefa?.priority ?? "media"}
              >
                <SelectTrigger id="prioridade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((prioridade) => (
                    <SelectItem key={prioridade} value={prioridade}>
                      {ROTULOS_PRIORIDADE[prioridade]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataVencimento">
                {repeticao === "nenhuma" ? "Vencimento" : "Início da repetição"}
              </Label>
              <Input
                id="dataVencimento"
                name="dataVencimento"
                type="date"
                defaultValue={tarefa?.due_date ?? dataPadrao ?? ""}
                aria-invalid={Boolean(erros?.dataVencimento)}
              />
              {erros?.dataVencimento?.[0] ? (
                <p className="text-sm text-destructive">
                  {erros.dataVencimento[0]}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="recorrencia">Repetição</Label>
              <Select
                name="recorrencia"
                value={repeticao}
                onValueChange={(valor) =>
                  setRepeticao(valor as OpcaoRepeticao)
                }
              >
                <SelectTrigger id="recorrencia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(ROTULOS_REPETICAO) as OpcaoRepeticao[]
                  ).map((opcao) => (
                    <SelectItem key={opcao} value={opcao}>
                      {ROTULOS_REPETICAO[opcao]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {repeticao === "semanal" ? (
            <div className="flex flex-col gap-2">
              <Label>Dias da semana</Label>
              <div className="flex flex-wrap gap-2">
                {NOMES_CURTOS_DIAS.map((nome, dia) => {
                  const ativo = diasDaSemana.includes(dia);

                  return (
                    <button
                      key={nome}
                      type="button"
                      role="checkbox"
                      aria-checked={ativo}
                      onClick={() => alternarDia(dia)}
                      className={cn(
                        "h-10 min-w-11 rounded-md border px-2 text-sm font-medium transition-colors",
                        ativo
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-input text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {nome}
                    </button>
                  );
                })}
              </div>

              {diasDaSemana.map((dia) => (
                <input
                  key={dia}
                  type="hidden"
                  name="diasDaSemana"
                  value={dia}
                />
              ))}

              {erros?.diasDaSemana?.[0] ? (
                <p className="text-sm text-destructive">
                  {erros.diasDaSemana[0]}
                </p>
              ) : null}
            </div>
          ) : null}

          {repeticao === "mensal" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="diaDoMes">Dia do mês</Label>
              <Input
                id="diaDoMes"
                name="diaDoMes"
                type="number"
                min={1}
                max={31}
                inputMode="numeric"
                defaultValue={tarefa?.recurrence_day_of_month ?? 1}
                className="sm:max-w-32"
                aria-invalid={Boolean(erros?.diaDoMes)}
              />
              <p className="text-xs text-muted-foreground">
                Em meses mais curtos, cai no último dia.
              </p>
              {erros?.diaDoMes?.[0] ? (
                <p className="text-sm text-destructive">{erros.diaDoMes[0]}</p>
              ) : null}
            </div>
          ) : null}

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
              {editando ? "Salvar" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
