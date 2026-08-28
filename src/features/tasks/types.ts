import { type DataISO } from "@/lib/date";
import {
  type LinhaTarefa,
  type PrioridadeTarefa,
  type StatusTarefa,
} from "@/types/database";

import { type RegraRecorrencia } from "./recurrence";

export type AreaResumida = {
  id: string;
  nome: string;
  cor: string;
};

/**
 * O que a interface exibe numa lista de tarefas.
 *
 * Unifica os dois casos do modelo: uma tarefa simples (sem `ocorrenciaId`) e
 * uma ocorrência de tarefa recorrente. Assim os componentes de lista não
 * precisam saber de qual tabela a linha veio — só as ações precisam.
 */
export type ItemTarefa = {
  /** Identificador estável para o React e para as ações. */
  chave: string;
  tarefaId: string;
  /** `null` em tarefa simples; preenchido em ocorrência de recorrente. */
  ocorrenciaId: string | null;
  titulo: string;
  descricao: string | null;
  prioridade: PrioridadeTarefa;
  status: StatusTarefa;
  dataVencimento: DataISO | null;
  concluidaEm: string | null;
  area: AreaResumida | null;
  recorrencia: RegraRecorrencia | null;
  /** Linha original de `tasks`, usada para preencher o formulário de edição. */
  tarefa: LinhaTarefa;
};

export const ROTULOS_PRIORIDADE: Record<PrioridadeTarefa, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const PRIORIDADES: readonly PrioridadeTarefa[] = [
  "alta",
  "media",
  "baixa",
] as const;

/** Ordem de exibição: alta primeiro. */
export const PESO_PRIORIDADE: Record<PrioridadeTarefa, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};
