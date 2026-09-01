import { z } from "zod";

const esquemaEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL precisa ser uma URL válida."),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY não pode ser vazia."),
});

export type Env = z.infer<typeof esquemaEnv>;

/**
 * Lê e valida as variáveis de ambiente do Supabase.
 *
 * A validação é feita sob demanda (e não no topo do módulo) para que o
 * `next build` funcione em ambientes sem as variáveis — o erro aparece no
 * primeiro uso real do cliente, com uma mensagem clara.
 *
 * As chaves são referenciadas literalmente porque o Next só substitui
 * `process.env.NEXT_PUBLIC_*` quando o acesso é estático.
 */
export function lerEnv(): Env {
  const resultado = esquemaEnv.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((problema) => `- ${problema.message}`)
      .join("\n");

    throw new Error(
      "Configuração do Supabase ausente ou inválida.\n" +
        `${detalhes}\n` +
        "Copie .env.example para .env.local e preencha os valores do seu " +
        "projeto Supabase.",
    );
  }

  return resultado.data;
}

const esquemaPush = z.object({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
});

/**
 * Chave pública VAPID, ou `null` quando as notificações não estão
 * configuradas neste ambiente.
 *
 * Devolver `null` em vez de lançar é proposital: o app precisa funcionar sem
 * notificações — quem clona o repositório não deveria ser obrigado a gerar
 * chaves só para rodar a aplicação.
 */
export function lerChavePublicaPush(): string | null {
  const resultado = esquemaPush.safeParse({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  return resultado.success ? resultado.data.NEXT_PUBLIC_VAPID_PUBLIC_KEY : null;
}

const esquemaEnvioPush = z.object({
  VAPID_PRIVATE_KEY: z.string().min(1, "VAPID_PRIVATE_KEY ausente."),
  VAPID_SUBJECT: z
    .string()
    .min(1, "VAPID_SUBJECT ausente (ex.: mailto:voce@exemplo.com)."),
  CRON_SECRET: z.string().min(16, "CRON_SECRET ausente ou curto demais."),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY ausente."),
});

/**
 * Segredos usados apenas pela rota do resumo diário.
 *
 * Nenhum tem prefixo NEXT_PUBLIC_, então o Next nunca os embute no pacote do
 * navegador. Ler isto de um Client Component é erro de programação e falha
 * em tempo de execução.
 */
export function lerEnvEnvioPush() {
  const resultado = esquemaEnvioPush.safeParse({
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    CRON_SECRET: process.env.CRON_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((problema) => `- ${problema.message}`)
      .join("\n");

    throw new Error(`Notificações mal configuradas.\n${detalhes}`);
  }

  return resultado.data;
}
