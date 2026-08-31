import { lancarErroDeLeitura } from "@/lib/errors";
import { criarClienteServidor } from "@/lib/supabase/server";
import { type LinhaNota } from "@/types/database";

/**
 * Anotações do usuário, da editada mais recentemente para a mais antiga —
 * a ordem em que se procura uma nota na prática.
 */
export async function listarNotas(): Promise<LinhaNota[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    lancarErroDeLeitura(error, "carregar suas anotações");
  }

  return data ?? [];
}
