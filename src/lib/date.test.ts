import { describe, expect, it } from "vitest";

import {
  diaDaSemana,
  diferencaEmDias,
  ehDataISO,
  formatarData,
  formatarDataPorExtenso,
  limitesDoDia,
  rotuloRelativo,
  somarDias,
  ultimasDatas,
} from "./date";

// 2026-09-01 é uma terça-feira. As datas do arquivo são derivadas dela.
const TERCA = "2026-09-01";

describe("somarDias", () => {
  it("atravessa a virada do mês", () => {
    expect(somarDias("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("aceita deslocamento negativo", () => {
    expect(somarDias(TERCA, -1)).toBe("2026-08-31");
  });

  it("respeita ano bissexto", () => {
    expect(somarDias("2028-02-28", 1)).toBe("2028-02-29");
    expect(somarDias("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("diaDaSemana", () => {
  it("usa 0 para domingo e 6 para sábado", () => {
    expect(diaDaSemana("2026-09-06")).toBe(0);
    expect(diaDaSemana(TERCA)).toBe(2);
    expect(diaDaSemana("2026-09-05")).toBe(6);
  });
});

describe("ehDataISO", () => {
  it("aceita o formato yyyy-MM-dd", () => {
    expect(ehDataISO(TERCA)).toBe(true);
  });

  it("recusa formato errado e dia inexistente", () => {
    expect(ehDataISO("01/09/2026")).toBe(false);
    expect(ehDataISO("2026-13-01")).toBe(false);
    expect(ehDataISO("2026-02-30")).toBe(false);
  });
});

describe("diferencaEmDias", () => {
  it("conta em dias corridos, com sinal", () => {
    expect(diferencaEmDias(TERCA, "2026-09-04")).toBe(3);
    expect(diferencaEmDias(TERCA, "2026-08-30")).toBe(-2);
    expect(diferencaEmDias(TERCA, TERCA)).toBe(0);
  });
});

describe("ultimasDatas", () => {
  it("termina na data de referência e vai da mais antiga para a mais nova", () => {
    expect(ultimasDatas(3, TERCA)).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
    ]);
  });
});

describe("rotuloRelativo", () => {
  it("nomeia os dias vizinhos", () => {
    expect(rotuloRelativo(TERCA, TERCA)).toBe("Hoje");
    expect(rotuloRelativo("2026-09-02", TERCA)).toBe("Amanhã");
    expect(rotuloRelativo("2026-08-31", TERCA)).toBe("Ontem");
  });

  it("diz há quantos dias a tarefa está atrasada", () => {
    expect(rotuloRelativo("2026-08-29", TERCA)).toBe("Atrasada há 3 dias");
  });

  it("usa o nome do dia dentro da semana e a data cheia depois dela", () => {
    expect(rotuloRelativo("2026-09-04", TERCA)).toBe("sexta-feira");
    expect(rotuloRelativo("2026-09-11", TERCA)).toBe("11/09/2026");
  });
});

describe("formatação", () => {
  it("escreve a data curta e por extenso em português", () => {
    expect(formatarData(TERCA)).toBe("01/09/2026");
    expect(formatarDataPorExtenso(TERCA)).toBe("terça-feira, 1 de setembro");
  });
});

describe("limitesDoDia", () => {
  it("converte o dia civil de São Paulo (UTC-3) para um intervalo em UTC", () => {
    expect(limitesDoDia(TERCA)).toEqual({
      inicio: "2026-09-01T03:00:00.000Z",
      fim: "2026-09-02T03:00:00.000Z",
    });
  });
});
