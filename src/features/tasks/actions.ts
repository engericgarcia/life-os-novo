"use server";

import { revalidatePath } from "next/cache";

import { hoje, type DataISO } from "@/lib/date";
import {
  falha,
  falhaDoSupabase,
  sucesso,
  type EstadoAcao,
  type ResultadoAcao,
} from "@/lib/errors";
import { criarClienteServidor, exigirUsuario } from "@/lib/supabase/server";
import { errosPorCampo, numeros, texto, textoOpcional } from "@/lib/validation";
import { type TipoRecorrencia } from "@/types/database";

import {
  primeiraOcorrencia,
  proximaOcorrencia,
  regraDaTarefa,
  type RegraRecorrencia,
} from "./recurrence";
import { SEM_AREA } from "./constants";
import {
  esquemaAlternarConclusao,
  esquemaAtualizarTarefa,
  esquemaCriarTarefa,
  esquemaExcluirTarefa,
  OPCOES_RECORRENCIA,
} from "./schemas";

function revalidarTarefas() {
  revalidatePath("/tarefas");
  revalidatePath("/hoje");
}

type OpcaoRecorrencia = (typeof OPCOES_RECORRENCIA)[number];

/** Campos de recorrência como o banco os espera. */
type CamposRecorrencia = {
  recurrence: TipoRecorrencia | null;
  recurrence_weekdays: number[] | null;
  recurrence_day_of_month: number | null;
};

function camposRecorrencia(dados: {
  recorrencia: OpcaoRecorrencia;
  diasDaSemana: number[];
  diaDoMes?: number | null;
}): CamposRecorrencia {
  switch (dados.recorrencia) {
    case "nenhuma":
      return {
        recurrence: null,
        recurrence_weekdays: null,
        recurrence_day_of_month: null,
      };

    case "diaria":
      return {
        recurrence: "diaria",
        recurrence_weekdays: null,
        recurrence_day_of_month: null,
      };

    case "semanal":
      return {
        recurrence: "semanal",
        recurrence_weekdays: [...new Set(dados.diasDaSemana)].sort(
          (a, b) => a - b,
        ),
        recurrence_day_of_month: null,
      };

    case "mensal":
      return {
        recurrence: "mensal",
        recurrence_weekdays: null,
        recurrence_day_of_month: dados.diaDoMes ?? null,
      };
  }
}

/** Duas regras são "iguais" quando geram exatamente as mesmas datas. */
function mesmaRecorrencia(a: CamposRecorrencia, b: CamposRecorrencia): boolean {
  return (
    a.recurrence === b.recurrence &&
    a.recurrence_day_of_month === b.recurrence_day_of_month &&
    JSON.stringify(a.recurrence_weekdays) ===
      JSON.stringify(b.recurrence_weekdays)
  );
}

function lerFormulario(formData: FormData) {
  const areaId = textoOpcional(formData, "areaId");
  const diaDoMes = textoOpcional(formData, "diaDoMes");

  return {
    titulo: texto(formData, "titulo"),
    descricao: textoOpcional(formData, "descricao"),
    // O <Select> não aceita valor vazio, então "nenhuma" representa "sem área".
    areaId: !areaId || areaId === SEM_AREA ? null : areaId,
    prioridade: texto(formData, "prioridade"),
    dataVencimento: textoOpcional(formData, "dataVencimento") ?? null,
    recorrencia: texto(formData, "recorrencia"),
    diasDaSemana: numeros(formData, "diasDaSemana"),
    diaDoMes: diaDoMes ? Number(diaDoMes) : null,
  };
}

/**
 * Cria a primeira ocorrência de uma tarefa recorrente.
 *
 * `upsert` com `ignoreDuplicates` torna a operação idempotente: o índice
 * único (task_id, due_date) impede duplicar a mesma data se a ação for
 * disparada duas vezes.
 */
async function criarOcorrencia(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  dados: { usuarioId: string; tarefaId: string; data: DataISO },
) {
  return supabase.from("task_occurrences").upsert(
    {
      user_id: dados.usuarioId,
      task_id: dados.tarefaId,
      due_date: dados.data,
      status: "pendente",
    },
    { onConflict: "task_id,due_date", ignoreDuplicates: true },
  );
}

export async function criarTarefa(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaCriarTarefa.safeParse(lerFormulario(formData));

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  const dados = analise.data;
  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();
  const recorrencia = camposRecorrencia(dados);

  const { data: tarefa, error } = await supabase
    .from("tasks")
    .insert({
      user_id: usuario.id,
      area_id: dados.areaId,
      title: dados.titulo,
      description: dados.descricao ?? null,
      priority: dados.prioridade,
      due_date: dados.dataVencimento,
      ...recorrencia,
    })
    .select("id")
    .single();

  if (error) {
    return falhaDoSupabase(error, "criar a tarefa");
  }

  // Tarefa recorrente nasce com exatamente uma ocorrência em aberto.
  if (recorrencia.recurrence && dados.dataVencimento) {
    const regra = regraDaTarefa(recorrencia) as RegraRecorrencia;
    const data = primeiraOcorrencia(regra, dados.dataVencimento, hoje());

    const { error: erroOcorrencia } = await criarOcorrencia(supabase, {
      usuarioId: usuario.id,
      tarefaId: tarefa.id,
      data,
    });

    if (erroOcorrencia) {
      // Sem a primeira ocorrência a tarefa recorrente seria invisível:
      // desfaz para não deixar lixo no banco.
      await supabase.from("tasks").delete().eq("id", tarefa.id);

      return falhaDoSupabase(erroOcorrencia, "criar a tarefa repetida");
    }
  }

  revalidarTarefas();

  return sucesso();
}

export async function atualizarTarefa(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaAtualizarTarefa.safeParse({
    id: texto(formData, "id"),
    ...lerFormulario(formData),
  });

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  const dados = analise.data;
  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { data: atual, error: erroLeitura } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", dados.id)
    .maybeSingle();

  if (erroLeitura) {
    return falhaDoSupabase(erroLeitura, "carregar a tarefa");
  }

  if (!atual) {
    return falha("Tarefa não encontrada.");
  }

  const nova = camposRecorrencia(dados);
  const antiga: CamposRecorrencia = {
    recurrence: atual.recurrence,
    recurrence_weekdays: atual.recurrence_weekdays,
    recurrence_day_of_month: atual.recurrence_day_of_month,
  };
  const regraMudou = !mesmaRecorrencia(antiga, nova);

  const { error } = await supabase
    .from("tasks")
    .update({
      area_id: dados.areaId,
      title: dados.titulo,
      description: dados.descricao ?? null,
      priority: dados.prioridade,
      due_date: dados.dataVencimento,
      ...nova,
      // Ao virar recorrente, o estado passa a viver nas ocorrências.
      ...(nova.recurrence
        ? { status: "pendente" as const, completed_at: null }
        : {}),
    })
    .eq("id", dados.id);

  if (error) {
    return falhaDoSupabase(error, "salvar a tarefa");
  }

  if (regraMudou) {
    // A mudança de regra vale só para o futuro: as ocorrências já concluídas
    // permanecem como histórico, as pendentes são recalculadas.
    const { error: erroLimpeza } = await supabase
      .from("task_occurrences")
      .delete()
      .eq("task_id", dados.id)
      .eq("status", "pendente");

    if (erroLimpeza) {
      return falhaDoSupabase(erroLimpeza, "atualizar as repetições da tarefa");
    }

    if (nova.recurrence && dados.dataVencimento) {
      const regra = regraDaTarefa(nova) as RegraRecorrencia;
      const data = primeiraOcorrencia(regra, dados.dataVencimento, hoje());

      const { error: erroOcorrencia } = await criarOcorrencia(supabase, {
        usuarioId: usuario.id,
        tarefaId: dados.id,
        data,
      });

      if (erroOcorrencia) {
        return falhaDoSupabase(
          erroOcorrencia,
          "atualizar as repetições da tarefa",
        );
      }
    }
  }

  revalidarTarefas();

  return sucesso();
}

export async function excluirTarefa(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaExcluirTarefa.safeParse({ id: texto(formData, "id") });

  if (!analise.success) {
    return falha("Tarefa inválida.");
  }

  await exigirUsuario();
  const supabase = await criarClienteServidor();

  // As ocorrências somem junto: o FK é ON DELETE CASCADE.
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", analise.data.id);

  if (error) {
    return falhaDoSupabase(error, "excluir a tarefa");
  }

  revalidarTarefas();

  return sucesso();
}

/**
 * Conclui ou reabre uma tarefa simples ou uma ocorrência.
 *
 * É aqui que a recorrência avança: ao concluir uma ocorrência, a próxima é
 * calculada e criada; ao reabrir, a que havia sido gerada é removida.
 */
export async function alternarConclusao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaAlternarConclusao.safeParse({
    tarefaId: texto(formData, "tarefaId"),
    ocorrenciaId: textoOpcional(formData, "ocorrenciaId") ?? null,
    concluir: texto(formData, "concluir") === "1",
  });

  if (!analise.success) {
    return falha("Não foi possível identificar a tarefa.");
  }

  const { tarefaId, ocorrenciaId, concluir } = analise.data;
  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();
  const agora = new Date().toISOString();

  if (!ocorrenciaId) {
    const { error } = await supabase
      .from("tasks")
      .update(
        concluir
          ? { status: "concluida", completed_at: agora }
          : { status: "pendente", completed_at: null },
      )
      .eq("id", tarefaId);

    if (error) {
      return falhaDoSupabase(error, "atualizar a tarefa");
    }

    revalidarTarefas();

    return sucesso();
  }

  const { data: ocorrencia, error: erroLeitura } = await supabase
    .from("task_occurrences")
    .select("*")
    .eq("id", ocorrenciaId)
    .maybeSingle();

  if (erroLeitura) {
    return falhaDoSupabase(erroLeitura, "carregar a ocorrência da tarefa");
  }

  if (!ocorrencia) {
    return falha("Ocorrência não encontrada.");
  }

  const { error: erroAtualizacao } = await supabase
    .from("task_occurrences")
    .update(
      concluir
        ? { status: "concluida", completed_at: agora }
        : { status: "pendente", completed_at: null },
    )
    .eq("id", ocorrenciaId);

  if (erroAtualizacao) {
    return falhaDoSupabase(erroAtualizacao, "atualizar a tarefa");
  }

  const { data: tarefa, error: erroTarefa } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", tarefaId)
    .maybeSingle();

  if (erroTarefa) {
    return falhaDoSupabase(erroTarefa, "carregar a tarefa");
  }

  const regra = tarefa ? regraDaTarefa(tarefa) : null;

  if (!regra) {
    revalidarTarefas();

    return sucesso();
  }

  if (concluir) {
    const proxima = proximaOcorrencia(regra, ocorrencia.due_date, hoje());

    const { error: erroProxima } = await criarOcorrencia(supabase, {
      usuarioId: usuario.id,
      tarefaId,
      data: proxima,
    });

    if (erroProxima) {
      return falhaDoSupabase(erroProxima, "agendar a próxima repetição");
    }
  } else {
    // Reabrir: a ocorrência gerada por esta conclusão volta a não existir,
    // para não ficarem duas em aberto ao mesmo tempo.
    const { error: erroRemocao } = await supabase
      .from("task_occurrences")
      .delete()
      .eq("task_id", tarefaId)
      .eq("status", "pendente")
      .gt("due_date", ocorrencia.due_date);

    if (erroRemocao) {
      return falhaDoSupabase(erroRemocao, "desfazer a próxima repetição");
    }
  }

  revalidarTarefas();

  return sucesso();
}
