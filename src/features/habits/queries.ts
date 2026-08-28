import { diaDaSemana, somarDias, type DataISO } from "@/lib/date";
import { lancarErroDeLeitura } from "@/lib/errors";
import { criarClienteServidor } from "@/lib/supabase/server";
import { type LinhaHabito } from "@/types/database";

import { calcularStreaks, montarGrade, type DiaConsistencia } from "./streaks";

/**
 * Janela de histórico carregada para o cálculo das sequências.
 *
 * Dois anos limitam o volume de dados por requisição e cobrem qualquer
 * sequência realista — a "melhor sequência" é, portanto, a melhor dentro
 * desta janela.
 */
const DIAS_DE_HISTORICO = 730;

export type HabitoComProgresso = {
  linha: LinhaHabito;
  diasAlvo: number[];
  /** Hoje é um dos dias-alvo do hábito? */
  alvoHoje: boolean;
  feitoHoje: boolean;
  streakAtual: number;
  melhorStreak: number;
  grade: DiaConsistencia[];
};

export async function listarHabitosComProgresso(
  hoje: DataISO,
): Promise<HabitoComProgresso[]> {
  const supabase = await criarClienteServidor();

  const [habitos, checkins] = await Promise.all([
    supabase.from("habits").select("*").order("name", { ascending: true }),
    supabase
      .from("habit_checkins")
      .select("habit_id, date")
      .gte("date", somarDias(hoje, -DIAS_DE_HISTORICO)),
  ]);

  if (habitos.error) {
    lancarErroDeLeitura(habitos.error, "carregar seus hábitos");
  }

  if (checkins.error) {
    lancarErroDeLeitura(checkins.error, "carregar os check-ins");
  }

  const porHabito = new Map<string, Set<DataISO>>();

  for (const checkin of checkins.data ?? []) {
    const datas = porHabito.get(checkin.habit_id) ?? new Set<DataISO>();
    datas.add(checkin.date);
    porHabito.set(checkin.habit_id, datas);
  }

  return (habitos.data ?? []).map((linha) => {
    const datas = porHabito.get(linha.id) ?? new Set<DataISO>();
    const diasAlvo = linha.target_weekdays;
    const { atual, melhor } = calcularStreaks({
      checkins: datas,
      diasAlvo,
      hoje,
    });

    return {
      linha,
      diasAlvo,
      alvoHoje: diasAlvo.includes(diaDaSemana(hoje)),
      feitoHoje: datas.has(hoje),
      streakAtual: atual,
      melhorStreak: melhor,
      grade: montarGrade({ checkins: datas, diasAlvo, hoje }),
    };
  });
}

/** Hábitos que devem ser cumpridos hoje, para a visão "Hoje". */
export async function listarHabitosDeHoje(
  hoje: DataISO,
): Promise<HabitoComProgresso[]> {
  const todos = await listarHabitosComProgresso(hoje);

  return todos.filter((habito) => habito.alvoHoje);
}
