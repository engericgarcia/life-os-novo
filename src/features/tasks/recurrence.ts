import { addMonths, getDaysInMonth, setDate, startOfMonth } from "date-fns";

import {
  diaDaSemana,
  NOMES_CURTOS_DIAS,
  paraData,
  paraDataISO,
  somarDias,
  type DataISO,
} from "@/lib/date";
import { type LinhaTarefa, type TipoRecorrencia } from "@/types/database";

/**
 * Regra de recorrência em formato fechado — o tipo carrega exatamente os
 * campos que aquele tipo usa, então não existe estado impossível em memória.
 *
 * Toda a lógica deste arquivo é pura: recebe regra + data de referência e
 * devolve data. Sem banco, sem relógio implícito. Ver docs/RECORRENCIA.md.
 */
export type RegraRecorrencia =
  | { tipo: "diaria" }
  | { tipo: "semanal"; diasDaSemana: number[] }
  | { tipo: "mensal"; diaDoMes: number };

export const TIPOS_RECORRENCIA: readonly TipoRecorrencia[] = [
  "diaria",
  "semanal",
  "mensal",
] as const;

/**
 * Ajusta o dia ao mês de referência: dia 31 em fevereiro vira o dia 28 (ou
 * 29). A regra continua guardando 31 — o ajuste é sempre local ao mês.
 */
function comDiaDoMes(referencia: Date, diaDoMes: number): Date {
  const ultimoDia = getDaysInMonth(referencia);
  return setDate(referencia, Math.min(diaDoMes, ultimoDia));
}

/**
 * Primeira data que satisfaz a regra a partir de `aPartirDe` (inclusive).
 */
export function proximaDataValida(
  regra: RegraRecorrencia,
  aPartirDe: DataISO,
): DataISO {
  switch (regra.tipo) {
    case "diaria":
      return aPartirDe;

    case "semanal": {
      if (regra.diasDaSemana.length === 0) {
        throw new Error(
          "Recorrência semanal precisa de ao menos um dia da semana.",
        );
      }

      // No máximo 7 tentativas: uma semana sempre contém todo dia possível.
      for (let deslocamento = 0; deslocamento < 7; deslocamento += 1) {
        const candidata = somarDias(aPartirDe, deslocamento);

        if (regra.diasDaSemana.includes(diaDaSemana(candidata))) {
          return candidata;
        }
      }

      throw new Error("Não foi possível calcular a próxima data semanal.");
    }

    case "mensal": {
      const referencia = paraData(aPartirDe);
      const candidata = comDiaDoMes(referencia, regra.diaDoMes);

      if (candidata >= referencia) {
        return paraDataISO(candidata);
      }

      const proximoMes = startOfMonth(addMonths(referencia, 1));

      return paraDataISO(comDiaDoMes(proximoMes, regra.diaDoMes));
    }
  }
}

/**
 * Data da primeira ocorrência de uma tarefa recém-criada.
 *
 * Nunca cria ocorrência no passado: se a âncora escolhida pelo usuário já
 * passou, a busca começa em `hoje`.
 */
export function primeiraOcorrencia(
  regra: RegraRecorrencia,
  ancora: DataISO,
  hoje: DataISO,
): DataISO {
  const inicio = ancora > hoje ? ancora : hoje;

  return proximaDataValida(regra, inicio);
}

/**
 * Data da ocorrência seguinte, calculada quando a atual é concluída.
 *
 * Avança para a primeira data válida **estritamente depois** da mais recente
 * entre a ocorrência concluída e hoje. Assim:
 *
 * - concluir a de hoje gera a próxima no futuro (e não outra hoje);
 * - concluir uma atrasada não ressuscita os dias já perdidos.
 */
export function proximaOcorrencia(
  regra: RegraRecorrencia,
  dataConcluida: DataISO,
  hoje: DataISO,
): DataISO {
  const base = dataConcluida > hoje ? dataConcluida : hoje;

  return proximaDataValida(regra, somarDias(base, 1));
}

/**
 * Lê a regra a partir de uma linha de `tasks`. Devolve `null` para tarefas
 * simples. Lança se a linha estiver incoerente — o que as constraints do banco
 * já impedem, mas o tipo em TypeScript não.
 */
export function regraDaTarefa(
  tarefa: Pick<
    LinhaTarefa,
    "recurrence" | "recurrence_weekdays" | "recurrence_day_of_month"
  >,
): RegraRecorrencia | null {
  switch (tarefa.recurrence) {
    case null:
      return null;

    case "diaria":
      return { tipo: "diaria" };

    case "semanal": {
      const dias = tarefa.recurrence_weekdays;

      if (!dias || dias.length === 0) {
        throw new Error(
          "Tarefa semanal sem dias da semana definidos no banco.",
        );
      }

      return { tipo: "semanal", diasDaSemana: dias };
    }

    case "mensal": {
      const dia = tarefa.recurrence_day_of_month;

      if (!dia) {
        throw new Error("Tarefa mensal sem dia do mês definido no banco.");
      }

      return { tipo: "mensal", diaDoMes: dia };
    }
  }
}

/** Texto curto para exibir na lista: "Todo dia", "Seg, Qua e Sex", "Todo dia 15". */
export function descreverRecorrencia(regra: RegraRecorrencia): string {
  switch (regra.tipo) {
    case "diaria":
      return "Todo dia";

    case "semanal": {
      const nomes = [...regra.diasDaSemana]
        .sort((a, b) => a - b)
        .map((dia) => NOMES_CURTOS_DIAS[dia] ?? "?");

      if (nomes.length === 7) return "Todo dia";
      if (nomes.length === 1) return `Toda ${nomes[0]}`;

      const ultimo = nomes[nomes.length - 1];

      return `${nomes.slice(0, -1).join(", ")} e ${ultimo}`;
    }

    case "mensal":
      return `Todo dia ${regra.diaDoMes}`;
  }
}
