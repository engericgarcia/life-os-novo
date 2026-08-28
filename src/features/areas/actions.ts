"use server";

import { revalidatePath } from "next/cache";

import {
  falha,
  falhaDoSupabase,
  sucesso,
  type EstadoAcao,
  type ResultadoAcao,
} from "@/lib/errors";
import { criarClienteServidor, exigirUsuario } from "@/lib/supabase/server";
import { errosPorCampo, texto } from "@/lib/validation";

import {
  esquemaAtualizarArea,
  esquemaCriarArea,
  esquemaExcluirArea,
} from "./schemas";

/** As áreas aparecem na sidebar de tarefas e no formulário de tarefa. */
function revalidarAreas() {
  revalidatePath("/areas");
  revalidatePath("/tarefas");
  revalidatePath("/hoje");
}

export async function criarArea(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaCriarArea.safeParse({
    nome: texto(formData, "nome"),
    cor: texto(formData, "cor"),
  });

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { error } = await supabase.from("areas").insert({
    user_id: usuario.id,
    name: analise.data.nome,
    color: analise.data.cor,
  });

  if (error) {
    return falhaDoSupabase(error, "criar a área");
  }

  revalidarAreas();

  return sucesso();
}

export async function atualizarArea(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaAtualizarArea.safeParse({
    id: texto(formData, "id"),
    nome: texto(formData, "nome"),
    cor: texto(formData, "cor"),
  });

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("areas")
    .update({ name: analise.data.nome, color: analise.data.cor })
    .eq("id", analise.data.id);

  if (error) {
    return falhaDoSupabase(error, "salvar a área");
  }

  revalidarAreas();

  return sucesso();
}

export async function excluirArea(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaExcluirArea.safeParse({ id: texto(formData, "id") });

  if (!analise.success) {
    return falha("Área inválida.");
  }

  await exigirUsuario();
  const supabase = await criarClienteServidor();

  // As tarefas da área não são apagadas: o FK usa ON DELETE SET NULL e elas
  // passam a ficar "Sem área".
  const { error } = await supabase
    .from("areas")
    .delete()
    .eq("id", analise.data.id);

  if (error) {
    return falhaDoSupabase(error, "excluir a área");
  }

  revalidarAreas();

  return sucesso();
}
