import { lancarErroDeLeitura } from "@/lib/errors";
import { criarClienteServidor } from "@/lib/supabase/server";
import { type LinhaPreferenciasNotificacao } from "@/types/database";

export type EstadoNotificacoes = {
  preferencias: Pick<LinhaPreferenciasNotificacao, "enabled" | "send_hour">;
  /** Quantos aparelhos deste usuário estão inscritos. */
  aparelhos: number;
};

/** Padrão para quem nunca abriu a tela: ligado, às 8h. */
const PADRAO = { enabled: true, send_hour: 8 };

export async function obterEstadoNotificacoes(): Promise<EstadoNotificacoes> {
  const supabase = await criarClienteServidor();

  const [preferencias, inscricoes] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("enabled, send_hour")
      .maybeSingle(),
    supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true }),
  ]);

  if (preferencias.error) {
    lancarErroDeLeitura(
      preferencias.error,
      "carregar suas preferências de notificação",
    );
  }

  if (inscricoes.error) {
    lancarErroDeLeitura(inscricoes.error, "carregar seus aparelhos inscritos");
  }

  return {
    preferencias: preferencias.data ?? PADRAO,
    aparelhos: inscricoes.count ?? 0,
  };
}
