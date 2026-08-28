import { z } from "zod";

const cor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor da paleta.");

const nome = z
  .string()
  .min(1, "Informe um nome para a área.")
  .max(60, "O nome deve ter no máximo 60 caracteres.");

export const esquemaCriarArea = z.object({ nome, cor });

export const esquemaAtualizarArea = z.object({
  id: z.string().uuid("Área inválida."),
  nome,
  cor,
});

export const esquemaExcluirArea = z.object({
  id: z.string().uuid("Área inválida."),
});
