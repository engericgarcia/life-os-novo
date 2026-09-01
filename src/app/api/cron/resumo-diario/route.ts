import { NextResponse, type NextRequest } from "next/server";

import { enviarNotificacao } from "@/features/notifications/envio";
import { montarResumo, textoDoResumo } from "@/features/notifications/resumo";
import { formatInTimeZone } from "date-fns-tz";
import { FUSO_HORARIO, hoje as diaDeHoje } from "@/lib/date";
import { lerEnvEnvioPush } from "@/lib/env";
import { criarClienteAdministrativo } from "@/lib/supabase/admin";

/** web-push depende de APIs do Node; não roda no runtime Edge. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resumo diário.
 *
 * Chamada pelo agendador da Vercel (ver vercel.json). Pode rodar de hora em
 * hora ou uma vez ao dia: `last_sent_on` garante um envio por usuário por
 * dia, então rodar mais vezes é inofensivo e rodar menos apenas atrasa.
 */
export async function GET(request: NextRequest) {
  let segredoEsperado: string;

  try {
    segredoEsperado = lerEnvEnvioPush().CRON_SECRET;
  } catch (erro) {
    console.error("[life-os] resumo diário mal configurado", erro);

    return NextResponse.json(
      { erro: "Notificações não configuradas neste ambiente." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${segredoEsperado}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const hoje = diaDeHoje();
  const horaAtual = Number(formatInTimeZone(new Date(), FUSO_HORARIO, "H"));

  const supabase = criarClienteAdministrativo();

  // Quem está ligado, já passou da hora escolhida e ainda não recebeu hoje.
  const { data: destinatarios, error } = await supabase
    .from("notification_preferences")
    .select("user_id, send_hour, last_sent_on")
    .eq("enabled", true)
    .lte("send_hour", horaAtual)
    .or(`last_sent_on.is.null,last_sent_on.lt.${hoje}`);

  if (error) {
    console.error("[life-os] falha ao listar destinatários", error);

    return NextResponse.json(
      { erro: "Não foi possível listar os destinatários." },
      { status: 500 },
    );
  }

  let enviados = 0;
  let semNovidade = 0;
  let inscricoesRemovidas = 0;

  for (const destinatario of destinatarios ?? []) {
    const resumo = await montarResumo(supabase, destinatario.user_id, hoje);
    const corpo = textoDoResumo(resumo);

    // Dia vazio não vira notificação: avisar que não há nada é ruído.
    if (!corpo) {
      semNovidade += 1;
      continue;
    }

    const { data: inscricoes } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", destinatario.user_id);

    if (!inscricoes || inscricoes.length === 0) continue;

    let algumSucesso = false;

    for (const inscricao of inscricoes) {
      const resultado = await enviarNotificacao(inscricao, {
        titulo: "Seu dia no life-os",
        corpo,
        url: "/hoje",
      });

      if (resultado.ok) {
        algumSucesso = true;
        await supabase
          .from("push_subscriptions")
          .update({ last_success_at: new Date().toISOString() })
          .eq("id", inscricao.id);
        continue;
      }

      if (resultado.expirada) {
        // O aparelho não existe mais para o serviço de push: manter a linha
        // só faria a próxima execução falhar de novo.
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", inscricao.id);
        inscricoesRemovidas += 1;
        continue;
      }

      console.error("[life-os] falha temporária ao enviar push", {
        usuario: destinatario.user_id,
        motivo: resultado.motivo,
      });
    }

    if (algumSucesso) {
      enviados += 1;
      await supabase
        .from("notification_preferences")
        .update({ last_sent_on: hoje })
        .eq("user_id", destinatario.user_id);
    }
  }

  return NextResponse.json({
    hoje,
    horaAtual,
    candidatos: destinatarios?.length ?? 0,
    enviados,
    semNovidade,
    inscricoesRemovidas,
  });
}
