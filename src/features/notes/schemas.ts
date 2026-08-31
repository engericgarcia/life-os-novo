import { z } from "zod";

const titulo = z
  .string()
  .min(1, "Informe um título para a anotação.")
  .max(140, "O título deve ter no máximo 140 caracteres.");

const conteudo = z
  .string()
  .max(20000, "A anotação ficou grande demais (limite de 20.000 caracteres).")
  .optional();

const areaId = z.string().uuid("Área inválida.").nullable().optional();

export const esquemaCriarNota = z.object({ titulo, conteudo, areaId });

export const esquemaAtualizarNota = z.object({
  id: z.string().uuid("Anotação inválida."),
  titulo,
  conteudo,
  areaId,
});

export const esquemaExcluirNota = z.object({
  id: z.string().uuid("Anotação inválida."),
});
