import { type PostgrestError } from "@supabase/supabase-js";

/**
 * Resultado padrão de toda Server Action.
 *
 * Nenhum erro é engolido: ou a ação retorna `ok: true`, ou devolve uma
 * mensagem em português pronta para exibição, e o erro técnico vai para o
 * log do servidor.
 */
export type ResultadoAcao<T = undefined> =
  | { ok: true; dados: T }
  | { ok: false; erro: string; errosPorCampo?: Record<string, string[]> };

export function sucesso(): ResultadoAcao;
export function sucesso<T>(dados: T): ResultadoAcao<T>;
export function sucesso<T>(dados?: T): ResultadoAcao<T | undefined> {
  return { ok: true, dados };
}

export function falha(
  erro: string,
  errosPorCampo?: Record<string, string[]>,
): ResultadoAcao<never> {
  return { ok: false, erro, errosPorCampo };
}

/** Mensagens amigáveis para os códigos de erro do Postgres que a UI pode causar. */
const MENSAGENS_POR_CODIGO: Record<string, string> = {
  "23505": "Já existe um registro com esse nome.",
  "23503": "O registro referenciado não existe mais.",
  "23514": "Os dados enviados não respeitam as regras do banco.",
  "42501": "Você não tem permissão para acessar este registro.",
  PGRST116: "Registro não encontrado.",
};

/**
 * Converte um erro do Supabase em `ResultadoAcao`, registrando o erro técnico
 * no servidor. Sempre chame isto — nunca ignore o `error` de uma query.
 */
export function falhaDoSupabase(
  erro: PostgrestError,
  contexto: string,
): ResultadoAcao<never> {
  console.error(`[life-os] ${contexto}`, {
    code: erro.code,
    message: erro.message,
    details: erro.details,
    hint: erro.hint,
  });

  const mensagem = erro.code ? MENSAGENS_POR_CODIGO[erro.code] : undefined;

  return falha(mensagem ?? `Não foi possível ${contexto}. Tente novamente.`);
}

/**
 * Lança um erro de leitura. Usado nas queries de Server Components, onde a
 * falha deve estourar para o error boundary em vez de renderizar dados vazios.
 */
export function lancarErroDeLeitura(
  erro: PostgrestError,
  contexto: string,
): never {
  console.error(`[life-os] ${contexto}`, {
    code: erro.code,
    message: erro.message,
    details: erro.details,
    hint: erro.hint,
  });

  throw new Error(`Não foi possível ${contexto}.`);
}

/** Estado usado com `useActionState`: `null` antes do primeiro envio. */
export type EstadoAcao = ResultadoAcao | null;
