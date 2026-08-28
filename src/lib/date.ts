import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  isValid,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/**
 * Fuso de referência do app. Todo "hoje" do sistema é o dia civil em
 * São Paulo, independente de onde o servidor estiver rodando.
 */
export const FUSO_HORARIO = "America/Sao_Paulo";

/**
 * Uma data no formato `yyyy-MM-dd` (as colunas `date` do Postgres).
 *
 * O app trabalha com datas "flutuantes": nunca convertemos para UTC, o que
 * elimina a classe de bugs em que uma tarefa do dia 10 aparece no dia 9.
 */
export type DataISO = string;

/** Dia civil de hoje em America/Sao_Paulo. */
export function hoje(): DataISO {
  return formatInTimeZone(new Date(), FUSO_HORARIO, "yyyy-MM-dd");
}

/** Converte `yyyy-MM-dd` em Date na meia-noite local (só para cálculo/formatação). */
export function paraData(data: DataISO): Date {
  const resultado = parseISO(`${data}T00:00:00`);

  if (!isValid(resultado)) {
    throw new Error(`Data inválida: ${data}`);
  }

  return resultado;
}

/** Converte um Date de volta para `yyyy-MM-dd`. */
export function paraDataISO(data: Date): DataISO {
  return format(data, "yyyy-MM-dd");
}

/** Verifica se a string está no formato `yyyy-MM-dd` e representa um dia real. */
export function ehDataISO(valor: string): valor is DataISO {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && isValid(parseISO(valor));
}

/** Soma dias a uma data ISO. */
export function somarDias(data: DataISO, dias: number): DataISO {
  return paraDataISO(addDays(paraData(data), dias));
}

/** Dia da semana: 0 = domingo ... 6 = sábado. */
export function diaDaSemana(data: DataISO): number {
  return getDay(paraData(data));
}

/** Diferença em dias corridos (`ate - de`). */
export function diferencaEmDias(de: DataISO, ate: DataISO): number {
  return differenceInCalendarDays(paraData(ate), paraData(de));
}

/** Lista as `quantidade` datas terminando em `ate` (inclusive), da mais antiga para a mais nova. */
export function ultimasDatas(quantidade: number, ate: DataISO): DataISO[] {
  const datas: DataISO[] = [];

  for (let i = quantidade - 1; i >= 0; i -= 1) {
    datas.push(somarDias(ate, -i));
  }

  return datas;
}

export const NOMES_CURTOS_DIAS = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

export const NOMES_DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

/** Ex.: "28/08/2026". */
export function formatarData(data: DataISO): string {
  return format(paraData(data), "dd/MM/yyyy", { locale: ptBR });
}

/** Ex.: "sexta-feira, 28 de agosto". */
export function formatarDataPorExtenso(data: DataISO): string {
  return format(paraData(data), "EEEE, d 'de' MMMM", { locale: ptBR });
}

/**
 * Rótulo relativo para listas: "Hoje", "Amanhã", "Ontem",
 * "Atrasada há 3 dias" ou a data curta.
 */
export function rotuloRelativo(data: DataISO, referencia: DataISO): string {
  const diferenca = diferencaEmDias(referencia, data);

  if (diferenca === 0) return "Hoje";
  if (diferenca === 1) return "Amanhã";
  if (diferenca === -1) return "Ontem";
  if (diferenca < -1) return `Atrasada há ${Math.abs(diferenca)} dias`;
  if (diferenca <= 7) return format(paraData(data), "EEEE", { locale: ptBR });

  return formatarData(data);
}

/**
 * Limites do dia civil em America/Sao_Paulo, em UTC.
 *
 * Usado para comparar com colunas `timestamptz` (ex.: `completed_at`), onde
 * "hoje" precisa virar um intervalo real.
 */
export function limitesDoDia(data: DataISO): { inicio: string; fim: string } {
  return {
    inicio: fromZonedTime(`${data}T00:00:00`, FUSO_HORARIO).toISOString(),
    fim: fromZonedTime(
      `${somarDias(data, 1)}T00:00:00`,
      FUSO_HORARIO,
    ).toISOString(),
  };
}
