import { describe, expect, it } from "vitest";

import {
  descreverRecorrencia,
  primeiraOcorrencia,
  proximaDataValida,
  proximaOcorrencia,
  regraDaTarefa,
  type RegraRecorrencia,
} from "./recurrence";

const HOJE = "2026-09-01"; // terça-feira
const SEG_QUA_SEX: RegraRecorrencia = {
  tipo: "semanal",
  diasDaSemana: [1, 3, 5],
};

describe("proximaDataValida", () => {
  it("na regra diária, a própria data já serve", () => {
    expect(proximaDataValida({ tipo: "diaria" }, HOJE)).toBe(HOJE);
  });

  it("na semanal, avança até o próximo dia-alvo", () => {
    expect(proximaDataValida(SEG_QUA_SEX, HOJE)).toBe("2026-09-02");
  });

  it("na semanal, não avança quando a data já é dia-alvo", () => {
    expect(proximaDataValida(SEG_QUA_SEX, "2026-09-02")).toBe("2026-09-02");
  });

  it("na semanal, atravessa a virada da semana", () => {
    // Sábado, com alvos seg/qua/sex: a próxima é a segunda seguinte.
    expect(proximaDataValida(SEG_QUA_SEX, "2026-09-05")).toBe("2026-09-07");
  });

  it("recusa uma regra semanal sem dias", () => {
    expect(() =>
      proximaDataValida({ tipo: "semanal", diasDaSemana: [] }, HOJE),
    ).toThrow(/dia da semana/i);
  });

  it("na mensal, cai no dia do mês corrente ou no mês seguinte", () => {
    expect(proximaDataValida({ tipo: "mensal", diaDoMes: 15 }, HOJE)).toBe(
      "2026-09-15",
    );
    expect(
      proximaDataValida({ tipo: "mensal", diaDoMes: 15 }, "2026-09-20"),
    ).toBe("2026-10-15");
  });

  it("na mensal, encurta o dia 31 para o último dia de fevereiro", () => {
    expect(
      proximaDataValida({ tipo: "mensal", diaDoMes: 31 }, "2026-02-01"),
    ).toBe("2026-02-28");
    expect(
      proximaDataValida({ tipo: "mensal", diaDoMes: 31 }, "2028-02-01"),
    ).toBe("2028-02-29");
  });

  it("na mensal, guardar o dia 31 não estraga os meses longos", () => {
    expect(
      proximaDataValida({ tipo: "mensal", diaDoMes: 31 }, "2026-03-01"),
    ).toBe("2026-03-31");
  });
});

describe("primeiraOcorrencia", () => {
  it("nunca nasce no passado: âncora vencida começa hoje", () => {
    expect(primeiraOcorrencia({ tipo: "diaria" }, "2026-08-20", HOJE)).toBe(
      HOJE,
    );
  });

  it("respeita a âncora quando ela está no futuro", () => {
    expect(primeiraOcorrencia({ tipo: "diaria" }, "2026-09-10", HOJE)).toBe(
      "2026-09-10",
    );
  });
});

describe("proximaOcorrencia", () => {
  it("concluir a de hoje gera a próxima no futuro, não outra hoje", () => {
    expect(proximaOcorrencia({ tipo: "diaria" }, HOJE, HOJE)).toBe(
      "2026-09-02",
    );
  });

  it("concluir uma atrasada não ressuscita os dias perdidos", () => {
    expect(proximaOcorrencia({ tipo: "diaria" }, "2026-08-25", HOJE)).toBe(
      "2026-09-02",
    );
  });

  it("segue os dias-alvo da regra semanal", () => {
    // Concluída na quarta: a próxima é a sexta, não a quinta.
    expect(proximaOcorrencia(SEG_QUA_SEX, "2026-09-02", "2026-09-02")).toBe(
      "2026-09-04",
    );
  });
});

describe("regraDaTarefa", () => {
  const base = {
    recurrence_weekdays: null,
    recurrence_day_of_month: null,
  };

  it("devolve null para tarefa simples", () => {
    expect(regraDaTarefa({ ...base, recurrence: null })).toBeNull();
  });

  it("lê cada tipo de regra da linha do banco", () => {
    expect(regraDaTarefa({ ...base, recurrence: "diaria" })).toEqual({
      tipo: "diaria",
    });
    expect(
      regraDaTarefa({
        ...base,
        recurrence: "semanal",
        recurrence_weekdays: [1, 3, 5],
      }),
    ).toEqual(SEG_QUA_SEX);
    expect(
      regraDaTarefa({
        ...base,
        recurrence: "mensal",
        recurrence_day_of_month: 15,
      }),
    ).toEqual({ tipo: "mensal", diaDoMes: 15 });
  });

  it("recusa linhas incoerentes que as constraints do banco impedem", () => {
    expect(() => regraDaTarefa({ ...base, recurrence: "semanal" })).toThrow(
      /dias da semana/i,
    );
    expect(() => regraDaTarefa({ ...base, recurrence: "mensal" })).toThrow(
      /dia do mês/i,
    );
  });
});

describe("descreverRecorrencia", () => {
  it("resume a regra em texto curto", () => {
    expect(descreverRecorrencia({ tipo: "diaria" })).toBe("Todo dia");
    expect(descreverRecorrencia(SEG_QUA_SEX)).toBe("Seg, Qua e Sex");
    expect(descreverRecorrencia({ tipo: "semanal", diasDaSemana: [2] })).toBe(
      "Toda Ter",
    );
    expect(descreverRecorrencia({ tipo: "mensal", diaDoMes: 15 })).toBe(
      "Todo dia 15",
    );
  });

  it("chama de 'Todo dia' a semanal que cobre os sete dias", () => {
    expect(
      descreverRecorrencia({
        tipo: "semanal",
        diasDaSemana: [0, 1, 2, 3, 4, 5, 6],
      }),
    ).toBe("Todo dia");
  });

  it("ordena os dias independentemente da ordem guardada", () => {
    expect(
      descreverRecorrencia({ tipo: "semanal", diasDaSemana: [5, 1, 3] }),
    ).toBe("Seg, Qua e Sex");
  });
});
