import { diaDaSemana, type DataISO } from "@/lib/date";
import { type criarClienteAdministrativo } from "@/lib/supabase/admin";

type ClienteAdmin = ReturnType<typeof criarClienteAdministrativo>;

export type Resumo = {
  tarefas: number;
  atrasadas: number;
  habitos: number;
};

/** Texto da notificação, ou `null` quando não há nada a dizer. */
export function textoDoResumo(resumo: Resumo): string | null {
  const partes: string[] = [];

  if (resumo.tarefas > 0) {
    const base = `${resumo.tarefas} ${resumo.tarefas === 1 ? "tarefa" : "tarefas"}`;
    partes.push(
      resumo.atrasadas > 0
        ? `${base} (${resumo.atrasadas} ${resumo.atrasadas === 1 ? "atrasada" : "atrasadas"})`
        : base,
    );
  }

  if (resumo.habitos > 0) {
    partes.push(
      `${resumo.habitos} ${resumo.habitos === 1 ? "hábito" : "hábitos"}`,
    );
  }

  if (partes.length === 0) return null;

  return `${partes.join(" · ")} para hoje.`;
}

/**
 * Conta o que está pendente hoje para um usuário.
 *
 * Recebe o cliente administrativo porque roda fora de qualquer sessão — ver
 * `src/lib/supabase/admin.ts`.
 */
export async function montarResumo(
  supabase: ClienteAdmin,
  usuarioId: string,
  hoje: DataISO,
): Promise<Resumo> {
  const [tarefas, ocorrencias, habitos, checkins] = await Promise.all([
    supabase
      .from("tasks")
      .select("due_date")
      .eq("user_id", usuarioId)
      .is("recurrence", null)
      .eq("status", "pendente")
      .not("due_date", "is", null)
      .lte("due_date", hoje),
    supabase
      .from("task_occurrences")
      .select("due_date")
      .eq("user_id", usuarioId)
      .eq("status", "pendente")
      .lte("due_date", hoje),
    supabase
      .from("habits")
      .select("id, target_weekdays")
      .eq("user_id", usuarioId),
    supabase
      .from("habit_checkins")
      .select("habit_id")
      .eq("user_id", usuarioId)
      .eq("date", hoje),
  ]);

  const vencimentos = [
    ...(tarefas.data ?? []).map((linha) => linha.due_date),
    ...(ocorrencias.data ?? []).map((linha) => linha.due_date),
  ].filter((data): data is string => data !== null);

  const feitos = new Set((checkins.data ?? []).map((linha) => linha.habit_id));
  const diaAtual = diaDaSemana(hoje);

  const habitosPendentes = (habitos.data ?? []).filter(
    (habito) =>
      habito.target_weekdays.includes(diaAtual) && !feitos.has(habito.id),
  ).length;

  return {
    tarefas: vencimentos.length,
    atrasadas: vencimentos.filter((data) => data < hoje).length,
    habitos: habitosPendentes,
  };
}
