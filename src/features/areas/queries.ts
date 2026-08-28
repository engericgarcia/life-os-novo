import { lancarErroDeLeitura } from "@/lib/errors";
import { criarClienteServidor } from "@/lib/supabase/server";
import { type LinhaArea } from "@/types/database";

/** Áreas do usuário em ordem alfabética. O RLS já limita ao dono. */
export async function listarAreas(): Promise<LinhaArea[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    lancarErroDeLeitura(error, "carregar suas áreas");
  }

  return data ?? [];
}
