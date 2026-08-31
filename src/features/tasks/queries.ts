import { limitesDoDia, somarDias, type DataISO } from "@/lib/date";
import { lancarErroDeLeitura } from "@/lib/errors";
import { criarClienteServidor } from "@/lib/supabase/server";
import {
  type LinhaOcorrencia,
  type LinhaTarefa,
  type StatusTarefa,
} from "@/types/database";

import { regraDaTarefa } from "./recurrence";
import { PESO_PRIORIDADE, type AreaResumida, type ItemTarefa } from "./types";

/**
 * As áreas são carregadas à parte e cruzadas em memória, em vez de usar o
 * embed do PostgREST (`select("*, areas(*)")`). São poucas linhas por usuário
 * e assim os tipos escritos à mão continuam simples e corretos.
 */
async function carregarMapaDeAreas(): Promise<Map<string, AreaResumida>> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("areas")
    .select("id, name, color");

  if (error) {
    lancarErroDeLeitura(error, "carregar suas áreas");
  }

  const mapa = new Map<string, AreaResumida>();

  for (const area of data ?? []) {
    mapa.set(area.id, { id: area.id, nome: area.name, cor: area.color });
  }

  return mapa;
}

function itemDeTarefaSimples(
  tarefa: LinhaTarefa,
  areas: Map<string, AreaResumida>,
): ItemTarefa {
  return {
    chave: `tarefa:${tarefa.id}`,
    tarefaId: tarefa.id,
    ocorrenciaId: null,
    titulo: tarefa.title,
    descricao: tarefa.description,
    prioridade: tarefa.priority,
    status: tarefa.status,
    dataVencimento: tarefa.due_date,
    concluidaEm: tarefa.completed_at,
    area: tarefa.area_id ? (areas.get(tarefa.area_id) ?? null) : null,
    recorrencia: null,
    tarefa,
  };
}

function itemDeOcorrencia(
  ocorrencia: LinhaOcorrencia,
  tarefa: LinhaTarefa,
  areas: Map<string, AreaResumida>,
): ItemTarefa {
  return {
    chave: `ocorrencia:${ocorrencia.id}`,
    tarefaId: tarefa.id,
    ocorrenciaId: ocorrencia.id,
    titulo: tarefa.title,
    descricao: tarefa.description,
    prioridade: tarefa.priority,
    status: ocorrencia.status,
    dataVencimento: ocorrencia.due_date,
    concluidaEm: ocorrencia.completed_at,
    area: tarefa.area_id ? (areas.get(tarefa.area_id) ?? null) : null,
    recorrencia: regraDaTarefa(tarefa),
    tarefa,
  };
}

/** Vencidas primeiro, sem data por último; empate resolvido pela prioridade. */
function ordenarPorVencimento(a: ItemTarefa, b: ItemTarefa): number {
  if (a.dataVencimento && b.dataVencimento) {
    if (a.dataVencimento !== b.dataVencimento) {
      return a.dataVencimento < b.dataVencimento ? -1 : 1;
    }
  } else if (a.dataVencimento !== b.dataVencimento) {
    return a.dataVencimento ? -1 : 1;
  }

  return PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade];
}

export type FiltroArea = string | "sem-area" | null;

/**
 * Itens da página de Tarefas: tarefas simples e ocorrências de recorrentes,
 * unificadas numa lista só.
 */
export async function listarItensTarefas({
  status,
  area,
}: {
  status: StatusTarefa;
  area: FiltroArea;
}): Promise<ItemTarefa[]> {
  const supabase = await criarClienteServidor();
  const areas = await carregarMapaDeAreas();

  let consultaTarefas = supabase.from("tasks").select("*");

  if (area === "sem-area") {
    consultaTarefas = consultaTarefas.is("area_id", null);
  } else if (area) {
    consultaTarefas = consultaTarefas.eq("area_id", area);
  }

  const { data: tarefas, error: erroTarefas } = await consultaTarefas;

  if (erroTarefas) {
    lancarErroDeLeitura(erroTarefas, "carregar suas tarefas");
  }

  const todas = tarefas ?? [];
  const simples = todas.filter((tarefa) => tarefa.recurrence === null);
  const recorrentes = todas.filter((tarefa) => tarefa.recurrence !== null);

  const itens: ItemTarefa[] = simples
    .filter((tarefa) => tarefa.status === status)
    .map((tarefa) => itemDeTarefaSimples(tarefa, areas));

  if (recorrentes.length > 0) {
    const porId = new Map(recorrentes.map((tarefa) => [tarefa.id, tarefa]));

    let consultaOcorrencias = supabase
      .from("task_occurrences")
      .select("*")
      .in("task_id", [...porId.keys()])
      .eq("status", status);

    // O histórico de concluídas pode crescer sem limite; a lista mostra as
    // mais recentes.
    consultaOcorrencias =
      status === "concluida"
        ? consultaOcorrencias.order("due_date", { ascending: false }).limit(100)
        : consultaOcorrencias.order("due_date", { ascending: true });

    const { data: ocorrencias, error: erroOcorrencias } =
      await consultaOcorrencias;

    if (erroOcorrencias) {
      lancarErroDeLeitura(erroOcorrencias, "carregar as tarefas repetidas");
    }

    for (const ocorrencia of ocorrencias ?? []) {
      const tarefa = porId.get(ocorrencia.task_id);

      if (tarefa) {
        itens.push(itemDeOcorrencia(ocorrencia, tarefa, areas));
      }
    }
  }

  if (status === "concluida") {
    return itens.sort((a, b) =>
      (a.concluidaEm ?? "") < (b.concluidaEm ?? "") ? 1 : -1,
    );
  }

  return itens.sort(ordenarPorVencimento);
}

/**
 * Tarefas da visão "Hoje": tudo que vence hoje ou já venceu e continua
 * pendente.
 */
export async function listarItensDeHoje(hoje: DataISO): Promise<ItemTarefa[]> {
  const supabase = await criarClienteServidor();
  const areas = await carregarMapaDeAreas();

  const [tarefasSimples, ocorrencias] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .is("recurrence", null)
      .eq("status", "pendente")
      .not("due_date", "is", null)
      .lte("due_date", hoje),
    supabase
      .from("task_occurrences")
      .select("*")
      .eq("status", "pendente")
      .lte("due_date", hoje),
  ]);

  if (tarefasSimples.error) {
    lancarErroDeLeitura(tarefasSimples.error, "carregar as tarefas de hoje");
  }

  if (ocorrencias.error) {
    lancarErroDeLeitura(ocorrencias.error, "carregar as tarefas repetidas");
  }

  const itens: ItemTarefa[] = (tarefasSimples.data ?? []).map((tarefa) =>
    itemDeTarefaSimples(tarefa, areas),
  );

  const linhasOcorrencias = ocorrencias.data ?? [];

  if (linhasOcorrencias.length > 0) {
    const ids = [...new Set(linhasOcorrencias.map((linha) => linha.task_id))];

    const { data: tarefasRecorrentes, error } = await supabase
      .from("tasks")
      .select("*")
      .in("id", ids);

    if (error) {
      lancarErroDeLeitura(error, "carregar as tarefas repetidas");
    }

    const porId = new Map(
      (tarefasRecorrentes ?? []).map((tarefa) => [tarefa.id, tarefa]),
    );

    for (const ocorrencia of linhasOcorrencias) {
      const tarefa = porId.get(ocorrencia.task_id);

      if (tarefa) {
        itens.push(itemDeOcorrencia(ocorrencia, tarefa, areas));
      }
    }
  }

  return itens.sort(ordenarPorVencimento);
}

export type DiaDaSemana = {
  data: DataISO;
  itens: ItemTarefa[];
};

/**
 * Visão da semana: o que vence em cada um dos próximos `dias` dias.
 *
 * As atrasadas saem separadas em vez de aparecerem no dia em que venceram —
 * espalhá-las pelo passado esconderia justamente o que precisa de atenção.
 */
export async function listarSemana(
  hoje: DataISO,
  dias = 7,
): Promise<{ atrasadas: ItemTarefa[]; semana: DiaDaSemana[] }> {
  const supabase = await criarClienteServidor();
  const areas = await carregarMapaDeAreas();
  const fim = somarDias(hoje, dias - 1);

  const [tarefasSimples, ocorrencias] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .is("recurrence", null)
      .eq("status", "pendente")
      .not("due_date", "is", null)
      .lte("due_date", fim),
    supabase
      .from("task_occurrences")
      .select("*")
      .eq("status", "pendente")
      .lte("due_date", fim),
  ]);

  if (tarefasSimples.error) {
    lancarErroDeLeitura(tarefasSimples.error, "carregar a semana");
  }

  if (ocorrencias.error) {
    lancarErroDeLeitura(ocorrencias.error, "carregar as tarefas repetidas");
  }

  const itens: ItemTarefa[] = (tarefasSimples.data ?? []).map((tarefa) =>
    itemDeTarefaSimples(tarefa, areas),
  );

  const linhasOcorrencias = ocorrencias.data ?? [];

  if (linhasOcorrencias.length > 0) {
    const ids = [...new Set(linhasOcorrencias.map((linha) => linha.task_id))];

    const { data: tarefasRecorrentes, error } = await supabase
      .from("tasks")
      .select("*")
      .in("id", ids);

    if (error) {
      lancarErroDeLeitura(error, "carregar as tarefas repetidas");
    }

    const porId = new Map(
      (tarefasRecorrentes ?? []).map((tarefa) => [tarefa.id, tarefa]),
    );

    for (const ocorrencia of linhasOcorrencias) {
      const tarefa = porId.get(ocorrencia.task_id);

      if (tarefa) {
        itens.push(itemDeOcorrencia(ocorrencia, tarefa, areas));
      }
    }
  }

  const atrasadas: ItemTarefa[] = [];
  const porData = new Map<DataISO, ItemTarefa[]>();

  for (let i = 0; i < dias; i += 1) {
    porData.set(somarDias(hoje, i), []);
  }

  for (const item of itens) {
    if (!item.dataVencimento) continue;

    if (item.dataVencimento < hoje) {
      atrasadas.push(item);
      continue;
    }

    porData.get(item.dataVencimento)?.push(item);
  }

  return {
    atrasadas: atrasadas.sort(ordenarPorVencimento),
    semana: [...porData.entries()].map(([data, lista]) => ({
      data,
      itens: lista.sort(ordenarPorVencimento),
    })),
  };
}

/**
 * Quantas tarefas foram concluídas hoje — somando tarefas simples e
 * ocorrências, comparando `completed_at` com os limites do dia em São Paulo.
 */
export async function contarConcluidasHoje(hoje: DataISO): Promise<number> {
  const supabase = await criarClienteServidor();
  const { inicio, fim } = limitesDoDia(hoje);

  const [tarefas, ocorrencias] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "concluida")
      .gte("completed_at", inicio)
      .lt("completed_at", fim),
    supabase
      .from("task_occurrences")
      .select("id", { count: "exact", head: true })
      .eq("status", "concluida")
      .gte("completed_at", inicio)
      .lt("completed_at", fim),
  ]);

  if (tarefas.error) {
    lancarErroDeLeitura(tarefas.error, "contar as tarefas concluídas hoje");
  }

  if (ocorrencias.error) {
    lancarErroDeLeitura(ocorrencias.error, "contar as tarefas concluídas hoje");
  }

  return (tarefas.count ?? 0) + (ocorrencias.count ?? 0);
}

/** Uma tarefa específica, para a edição. */
export async function obterTarefa(id: string): Promise<LinhaTarefa | null> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    lancarErroDeLeitura(error, "carregar a tarefa");
  }

  return data;
}
