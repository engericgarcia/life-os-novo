import { listarHabitosDeHoje } from "@/features/habits/queries";
import {
  contarConcluidasHoje,
  listarItensDeHoje,
} from "@/features/tasks/queries";
import { type DataISO } from "@/lib/date";

/**
 * Tudo o que a visão "Hoje" precisa, em paralelo.
 *
 * Fica numa função só para a página continuar declarativa e para as três
 * consultas não virarem uma cascata de awaits.
 */
export async function carregarVisaoDeHoje(hoje: DataISO) {
  const [tarefas, habitos, concluidasHoje] = await Promise.all([
    listarItensDeHoje(hoje),
    listarHabitosDeHoje(hoje),
    contarConcluidasHoje(hoje),
  ]);

  const atrasadas = tarefas.filter(
    (item) => item.dataVencimento !== null && item.dataVencimento < hoje,
  ).length;

  const habitosFeitos = habitos.filter((habito) => habito.feitoHoje).length;

  // "Sequência ativa": a maior sequência em curso entre os hábitos de hoje.
  const sequenciaAtiva = habitos.reduce(
    (maior, habito) => Math.max(maior, habito.streakAtual),
    0,
  );

  return {
    tarefas,
    habitos,
    contadores: {
      concluidasHoje,
      pendentes: tarefas.length,
      atrasadas,
      habitosFeitos,
      totalHabitos: habitos.length,
      sequenciaAtiva,
    },
  };
}
