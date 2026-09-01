import { describe, expect, it } from "vitest";

import { calcularStreaks, DIAS_NA_GRADE, montarGrade } from "./streaks";

const HOJE = "2026-09-01"; // terça-feira
const TODO_DIA = [0, 1, 2, 3, 4, 5, 6];
const SEG_QUA_SEX = [1, 3, 5];

describe("calcularStreaks", () => {
  it("devolve zero quando não há check-in ou dia-alvo", () => {
    expect(
      calcularStreaks({ checkins: new Set(), diasAlvo: TODO_DIA, hoje: HOJE }),
    ).toEqual({ atual: 0, melhor: 0 });

    expect(
      calcularStreaks({
        checkins: new Set(["2026-08-31"]),
        diasAlvo: [],
        hoje: HOJE,
      }),
    ).toEqual({ atual: 0, melhor: 0 });
  });

  it("conta os dias consecutivos até hoje", () => {
    const { atual } = calcularStreaks({
      checkins: new Set(["2026-08-30", "2026-08-31", HOJE]),
      diasAlvo: TODO_DIA,
      hoje: HOJE,
    });

    expect(atual).toBe(3);
  });

  it("o dia de hoje ainda em aberto não quebra a sequência", () => {
    // Sem check-in hoje: a sequência de ontem e anteontem continua valendo.
    const { atual } = calcularStreaks({
      checkins: new Set(["2026-08-30", "2026-08-31"]),
      diasAlvo: TODO_DIA,
      hoje: HOJE,
    });

    expect(atual).toBe(2);
  });

  it("um dia perdido no meio quebra a sequência", () => {
    const { atual } = calcularStreaks({
      checkins: new Set(["2026-08-29", HOJE]),
      diasAlvo: TODO_DIA,
      hoje: HOJE,
    });

    expect(atual).toBe(1);
  });

  it("hábito de seg/qua/sex não perde a sequência no fim de semana", () => {
    const { atual } = calcularStreaks({
      // sexta, quarta e segunda seguidas — os três últimos dias-alvo.
      checkins: new Set(["2026-09-04", "2026-09-02", "2026-08-31"]),
      diasAlvo: SEG_QUA_SEX,
      hoje: "2026-09-06", // domingo, fora dos dias-alvo
    });

    expect(atual).toBe(3);
  });

  it("guarda a melhor sequência mesmo depois de ela ser perdida", () => {
    const { atual, melhor } = calcularStreaks({
      checkins: new Set([
        "2026-08-01",
        "2026-08-02",
        "2026-08-03",
        "2026-08-04",
        // buraco de vários dias
        "2026-08-31",
      ]),
      diasAlvo: TODO_DIA,
      hoje: HOJE,
    });

    expect(melhor).toBe(4);
    expect(atual).toBe(1);
  });

  it("a melhor sequência nunca é menor que a atual", () => {
    const { atual, melhor } = calcularStreaks({
      checkins: new Set(["2026-08-31", HOJE]),
      diasAlvo: TODO_DIA,
      hoje: HOJE,
    });

    expect(melhor).toBeGreaterThanOrEqual(atual);
  });
});

describe("montarGrade", () => {
  it("cobre 90 dias por padrão e termina em hoje", () => {
    const grade = montarGrade({
      checkins: new Set([HOJE]),
      diasAlvo: TODO_DIA,
      hoje: HOJE,
    });

    expect(grade).toHaveLength(DIAS_NA_GRADE);
    expect(grade[grade.length - 1]).toEqual({
      data: HOJE,
      alvo: true,
      feito: true,
    });
  });

  it("marca alvo e feito de forma independente", () => {
    const grade = montarGrade({
      checkins: new Set(["2026-08-31"]),
      diasAlvo: SEG_QUA_SEX,
      hoje: HOJE,
      quantidade: 3,
    });

    expect(grade).toEqual([
      { data: "2026-08-30", alvo: false, feito: false }, // domingo
      { data: "2026-08-31", alvo: true, feito: true }, // segunda
      { data: "2026-09-01", alvo: false, feito: false }, // terça
    ]);
  });
});
