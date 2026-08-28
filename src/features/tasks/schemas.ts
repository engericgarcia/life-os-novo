import { z } from "zod";

import { ehDataISO } from "@/lib/date";

const titulo = z
  .string()
  .min(1, "Informe o título da tarefa.")
  .max(140, "O título deve ter no máximo 140 caracteres.");

const descricao = z
  .string()
  .max(2000, "A descrição deve ter no máximo 2000 caracteres.")
  .optional();

const areaId = z.string().uuid("Área inválida.").nullable().optional();

const prioridade = z.enum(["baixa", "media", "alta"], {
  errorMap: () => ({ message: "Escolha uma prioridade." }),
});

const dataVencimento = z
  .string()
  .refine(ehDataISO, "Data inválida.")
  .nullable()
  .optional();

/** "nenhuma" representa a tarefa simples; no banco vira `recurrence = null`. */
export const OPCOES_RECORRENCIA = [
  "nenhuma",
  "diaria",
  "semanal",
  "mensal",
] as const;

const camposTarefa = {
  titulo,
  descricao,
  areaId,
  prioridade,
  dataVencimento,
  recorrencia: z.enum(OPCOES_RECORRENCIA, {
    errorMap: () => ({ message: "Escolha o tipo de repetição." }),
  }),
  diasDaSemana: z.array(z.number().int().min(0).max(6)).default([]),
  diaDoMes: z.number().int().min(1).max(31).nullable().optional(),
};

/**
 * Regras que ligam recorrência aos demais campos. São as mesmas garantidas
 * pelas constraints do banco — aqui elas viram mensagem para o usuário.
 */
function validarRecorrencia(
  dados: {
    recorrencia: (typeof OPCOES_RECORRENCIA)[number];
    diasDaSemana: number[];
    diaDoMes?: number | null;
    dataVencimento?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (dados.recorrencia === "nenhuma") return;

  if (!dados.dataVencimento) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dataVencimento"],
      message: "Tarefa repetida precisa de uma data de início.",
    });
  }

  if (dados.recorrencia === "semanal" && dados.diasDaSemana.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["diasDaSemana"],
      message: "Escolha ao menos um dia da semana.",
    });
  }

  if (dados.recorrencia === "mensal" && !dados.diaDoMes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["diaDoMes"],
      message: "Informe o dia do mês (1 a 31).",
    });
  }
}

export const esquemaCriarTarefa = z
  .object(camposTarefa)
  .superRefine(validarRecorrencia);

export const esquemaAtualizarTarefa = z
  .object({ id: z.string().uuid("Tarefa inválida."), ...camposTarefa })
  .superRefine(validarRecorrencia);

export const esquemaExcluirTarefa = z.object({
  id: z.string().uuid("Tarefa inválida."),
});

export const esquemaAlternarConclusao = z.object({
  tarefaId: z.string().uuid("Tarefa inválida."),
  ocorrenciaId: z.string().uuid("Ocorrência inválida.").nullable().optional(),
  concluir: z.boolean(),
});

export type DadosCriarTarefa = z.infer<typeof esquemaCriarTarefa>;
export type DadosAtualizarTarefa = z.infer<typeof esquemaAtualizarTarefa>;
