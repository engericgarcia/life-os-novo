import webpush, { WebPushError } from "web-push";

import { lerEnvEnvioPush } from "@/lib/env";
import { type LinhaInscricaoPush } from "@/types/database";

let configurado = false;

function configurar() {
  if (configurado) return;

  const env = lerEnvEnvioPush();

  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    env.VAPID_PRIVATE_KEY,
  );

  configurado = true;
}

export type Mensagem = {
  titulo: string;
  corpo: string;
  url: string;
};

export type ResultadoEnvio =
  | { ok: true }
  /** O serviço de push recusou o endpoint em definitivo: apagar a inscrição. */
  | { ok: false; expirada: true }
  | { ok: false; expirada: false; motivo: string };

/**
 * Envia uma notificação para uma inscrição.
 *
 * Distingue a falha permanente (404/410 — o aparelho desinstalou o app ou
 * revogou a permissão) da temporária, porque só a primeira justifica apagar
 * a inscrição do banco.
 */
export async function enviarNotificacao(
  inscricao: Pick<LinhaInscricaoPush, "endpoint" | "p256dh" | "auth">,
  mensagem: Mensagem,
): Promise<ResultadoEnvio> {
  configurar();

  try {
    await webpush.sendNotification(
      {
        endpoint: inscricao.endpoint,
        keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
      },
      JSON.stringify(mensagem),
      { TTL: 12 * 60 * 60 },
    );

    return { ok: true };
  } catch (erro) {
    if (erro instanceof WebPushError) {
      const expirada = erro.statusCode === 404 || erro.statusCode === 410;

      return expirada
        ? { ok: false, expirada: true }
        : { ok: false, expirada: false, motivo: `HTTP ${erro.statusCode}` };
    }

    return {
      ok: false,
      expirada: false,
      motivo: erro instanceof Error ? erro.message : "erro desconhecido",
    };
  }
}
