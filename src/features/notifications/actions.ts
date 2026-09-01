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

import { esquemaInscricao, esquemaPreferencias } from "./schemas";

/**
 * Guarda a inscrição deste navegador.
 *
 * Recebe argumentos tipados em vez de FormData porque quem chama é o código
 * do navegador, depois de negociar a permissão com o usuário — não um
 * formulário.
 */
export async function salvarInscricao(dados: unknown): Promise<ResultadoAcao> {
  const analise = esquemaInscricao.safeParse(dados);

  if (!analise.success) {
    return falha("Não foi possível registrar este aparelho.");
  }

  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();

  // O mesmo endpoint pode reaparecer (reinstalação, permissão reconcedida):
  // o upsert evita duplicar e mantém a inscrição ligada ao dono atual.
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: usuario.id,
      endpoint: analise.data.endpoint,
      p256dh: analise.data.p256dh,
      auth: analise.data.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return falhaDoSupabase(error, "registrar as notificações neste aparelho");
  }

  // Primeira inscrição cria as preferências com o padrão.
  const { error: erroPreferencias } = await supabase
    .from("notification_preferences")
    .upsert(
      { user_id: usuario.id },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

  if (erroPreferencias) {
    return falhaDoSupabase(erroPreferencias, "salvar suas preferências");
  }

  revalidatePath("/ajustes");

  return sucesso();
}

export async function removerInscricao(
  endpoint: unknown,
): Promise<ResultadoAcao> {
  if (typeof endpoint !== "string" || endpoint.length === 0) {
    return falha("Aparelho não identificado.");
  }

  await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    return falhaDoSupabase(error, "desativar as notificações neste aparelho");
  }

  revalidatePath("/ajustes");

  return sucesso();
}

export async function salvarPreferencias(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<ResultadoAcao> {
  const analise = esquemaPreferencias.safeParse({
    ativado: texto(formData, "ativado") === "1",
    horaDeEnvio: Number(texto(formData, "horaDeEnvio")),
  });

  if (!analise.success) {
    return falha("Confira os campos.", errosPorCampo(analise.error));
  }

  const usuario = await exigirUsuario();
  const supabase = await criarClienteServidor();

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: usuario.id,
      enabled: analise.data.ativado,
      send_hour: analise.data.horaDeEnvio,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return falhaDoSupabase(error, "salvar suas preferências");
  }

  revalidatePath("/ajustes");

  return sucesso();
}
