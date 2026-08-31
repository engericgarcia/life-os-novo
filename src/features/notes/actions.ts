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
import { errosPorCampo, texto, textoOpcional } from "@/lib/validation";
import { SEM_AREA } from "@/features/tasks/constants";

import {
  esquemaAtualizarNota,
  esquemaCriarNota,
  esquemaExcluirNota,
} from "./schemas";

function revalidarNotas() {
  revalidatePath("/anotacoes");
}

function lerFormulario(formData: FormData) {
  const areaId = textoOpcional(formData, "areaId");

  return {
    titulo: texto(formData, "titulo"),
    conteudo: textoOpcional(formData, "conteudo"),
    areaId: !areaId || areaId === SEM_AREA ? null : areaId,
  };
}

export async function criarNota(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaCriarNota.safeParse(lerFormulario(formData));

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { error } = await supabase.from("notes").insert({
    user_id: usuario.id,
    area_id: analise.data.areaId,
    title: analise.data.titulo,
    content: analise.data.conteudo ?? null,
  });

  if (error) {
    return falhaDoSupabase(error, "criar a anotação");
  }

  revalidarNotas();

  return sucesso();
}

export async function atualizarNota(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaAtualizarNota.safeParse({
    id: texto(formData, "id"),
    ...lerFormulario(formData),
  });

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("notes")
    .update({
      area_id: analise.data.areaId,
      title: analise.data.titulo,
      content: analise.data.conteudo ?? null,
    })
    .eq("id", analise.data.id);

  if (error) {
    return falhaDoSupabase(error, "salvar a anotação");
  }

  revalidarNotas();

  return sucesso();
}

export async function excluirNota(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaExcluirNota.safeParse({ id: texto(formData, "id") });

  if (!analise.success) {
    return falha("Anotação inválida.");
  }

  await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", analise.data.id);

  if (error) {
    return falhaDoSupabase(error, "excluir a anotação");
  }

  revalidarNotas();

  return sucesso();
}
