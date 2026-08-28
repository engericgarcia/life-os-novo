import { z } from "zod";

import { ehDataISO } from "@/lib/date";

const nome = z
  .string()
  .min(1, "Informe um nome para o hábito.")
  .max(60, "O nome deve ter no máximo 60 caracteres.");

const cor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor da paleta.");

const diasAlvo = z
  .array(z.number().int().min(0).max(6))
  .min(1, "Escolha ao menos um dia da semana.");

export const esquemaCriarHabito = z.object({ nome, cor, diasAlvo });

export const esquemaAtualizarHabito = z.object({
  id: z.string().uuid("Hábito inválido."),
  nome,
  cor,
  diasAlvo,
});

export const esquemaExcluirHabito = z.object({
  id: z.string().uuid("Hábito inválido."),
});

export const esquemaCheckin = z.object({
  habitoId: z.string().uuid("Hábito inválido."),
  data: z.string().refine(ehDataISO, "Data inválida."),
  marcar: z.boolean(),
});
