"use server";

import { revalidatePath } from "next/cache";

import { hoje } from "@/lib/date";
import {
  falha,
  falhaDoSupabase,
  sucesso,
  type EstadoAcao,
  type ResultadoAcao,
} from "@/lib/errors";
import { criarClienteServidor, exigirUsuario } from "@/lib/supabase/server";
import { errosPorCampo, numeros, texto } from "@/lib/validation";

import {
  esquemaAtualizarHabito,
  esquemaCheckin,
  esquemaCriarHabito,
  esquemaExcluirHabito,
} from "./schemas";

function revalidarHabitos() {
  revalidatePath("/habitos");
  revalidatePath("/hoje");
}

/** Remove repetições e ordena — o banco guarda os dias sempre normalizados. */
function normalizarDias(dias: number[]): number[] {
  return [...new Set(dias)].sort((a, b) => a - b);
}

export async function criarHabito(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaCriarHabito.safeParse({
    nome: texto(formData, "nome"),
    cor: texto(formData, "cor"),
    diasAlvo: numeros(formData, "diasAlvo"),
  });

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { error } = await supabase.from("habits").insert({
    user_id: usuario.id,
    name: analise.data.nome,
    color: analise.data.cor,
    target_weekdays: normalizarDias(analise.data.diasAlvo),
  });

  if (error) {
    return falhaDoSupabase(error, "criar o hábito");
  }

  revalidarHabitos();

  return sucesso();
}

export async function atualizarHabito(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaAtualizarHabito.safeParse({
    id: texto(formData, "id"),
    nome: texto(formData, "nome"),
    cor: texto(formData, "cor"),
    diasAlvo: numeros(formData, "diasAlvo"),
  });

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  await exigirUsuario();
  const supabase = await criarClienteServidor();

  // Os check-ins já feitos não são tocados: mudar os dias-alvo altera o que
  // se espera daqui para a frente, não o histórico.
  const { error } = await supabase
    .from("habits")
    .update({
      name: analise.data.nome,
      color: analise.data.cor,
      target_weekdays: normalizarDias(analise.data.diasAlvo),
    })
    .eq("id", analise.data.id);

  if (error) {
    return falhaDoSupabase(error, "salvar o hábito");
  }

  revalidarHabitos();

  return sucesso();
}

export async function excluirHabito(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaExcluirHabito.safeParse({ id: texto(formData, "id") });

  if (!analise.success) {
    return falha("Hábito inválido.");
  }

  await exigirUsuario();
  const supabase = await criarClienteServidor();

  // Os check-ins somem junto: o FK é ON DELETE CASCADE.
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", analise.data.id);

  if (error) {
    return falhaDoSupabase(error, "excluir o hábito");
  }

  revalidarHabitos();

  return sucesso();
}

/**
 * Marca ou desmarca o check-in de um dia.
 *
 * O insert é idempotente (`unique (habit_id, date)` + `ignoreDuplicates`), o
 * que torna cliques repetidos inofensivos.
 */
export async function alternarCheckin(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaCheckin.safeParse({
    habitoId: texto(formData, "habitoId"),
    data: texto(formData, "data"),
    marcar: texto(formData, "marcar") === "1",
  });

  if (!analise.success) {
    return falha("Não foi possível identificar o hábito.");
  }

  const { habitoId, data, marcar } = analise.data;

  if (data > hoje()) {
    return falha("Não dá para marcar um hábito no futuro.");
  }

  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();

  if (marcar) {
    const { error } = await supabase.from("habit_checkins").upsert(
      { user_id: usuario.id, habit_id: habitoId, date: data },
      { onConflict: "habit_id,date", ignoreDuplicates: true },
    );

    if (error) {
      return falhaDoSupabase(error, "registrar o check-in");
    }
  } else {
    const { error } = await supabase
      .from("habit_checkins")
      .delete()
      .eq("habit_id", habitoId)
      .eq("date", data);

    if (error) {
      return falhaDoSupabase(error, "desfazer o check-in");
    }
  }

  revalidarHabitos();

  return sucesso();
}
