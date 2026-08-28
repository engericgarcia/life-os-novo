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
