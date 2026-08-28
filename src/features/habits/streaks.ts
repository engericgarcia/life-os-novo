import { diaDaSemana, somarDias, ultimasDatas, type DataISO } from "@/lib/date";

/** Quantos dias a grade de consistência mostra. */
export const DIAS_NA_GRADE = 90;

/**
 * Limite de segurança para os laços que caminham dia a dia para trás.
 * Dez anos é muito mais do que qualquer histórico real e garante término.
 */
const MAXIMO_DE_DIAS = 3650;

export type DiaConsistencia = {
  data: DataISO;
  /** O hábito deveria ser cumprido neste dia? */
  alvo: boolean;
  /** Houve check-in? */
  feito: boolean;
};

export type Streaks = {
  atual: number;
  melhor: number;
};

/**
 * Sequências de dias cumpridos, considerando só os dias-alvo do hábito.
 *
 * Um hábito de seg/qua/sex não perde a sequência no domingo — domingo
 * simplesmente não conta.
 *
 * Regra do dia de hoje: se hoje é dia-alvo e ainda não houve check-in, a
 * sequência **não** é quebrada. O dia ainda não acabou.
 *
 * Função pura: recebe a data de referência em vez de ler o relógio.
 */
export function calcularStreaks({
  checkins,
  diasAlvo,
  hoje,
}: {
  checkins: Set<DataISO>;
  diasAlvo: number[];
  hoje: DataISO;
}): Streaks {
  if (diasAlvo.length === 0 || checkins.size === 0) {
    return { atual: 0, melhor: 0 };
  }

  const ehAlvo = (data: DataISO) => diasAlvo.includes(diaDaSemana(data));

  // --- sequência atual: caminha para trás a partir de hoje ---
  let atual = 0;
  let cursor = hoje;

  if (ehAlvo(hoje) && !checkins.has(hoje)) {
    cursor = somarDias(hoje, -1);
  }

  for (let passo = 0; passo < MAXIMO_DE_DIAS; passo += 1) {
    if (!ehAlvo(cursor)) {
      cursor = somarDias(cursor, -1);
      continue;
    }

    if (!checkins.has(cursor)) break;

    atual += 1;
    cursor = somarDias(cursor, -1);
  }

  // --- melhor sequência: varre do primeiro check-in até hoje ---
  const primeiro = [...checkins].sort()[0];

  if (!primeiro) {
    return { atual, melhor: atual };
  }

  let melhor = 0;
  let corrente = 0;
  let dia = primeiro;

  for (let passo = 0; passo < MAXIMO_DE_DIAS && dia <= hoje; passo += 1) {
    if (ehAlvo(dia)) {
      if (checkins.has(dia)) {
        corrente += 1;
        melhor = Math.max(melhor, corrente);
      } else if (dia !== hoje) {
        // O dia de hoje ainda em aberto não zera nada.
        corrente = 0;
      }
    }

    dia = somarDias(dia, 1);
  }

  return { atual, melhor: Math.max(melhor, atual) };
}

/** Os últimos `DIAS_NA_GRADE` dias, do mais antigo para o mais recente. */
export function montarGrade({
  checkins,
  diasAlvo,
  hoje,
  quantidade = DIAS_NA_GRADE,
}: {
  checkins: Set<DataISO>;
  diasAlvo: number[];
  hoje: DataISO;
  quantidade?: number;
}): DiaConsistencia[] {
  return ultimasDatas(quantidade, hoje).map((data) => ({
    data,
    alvo: diasAlvo.includes(diaDaSemana(data)),
    feito: checkins.has(data),
  }));
}
