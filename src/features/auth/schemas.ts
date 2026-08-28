import { z } from "zod";

const email = z
  .string()
  .min(1, "Informe seu e-mail.")
  .email("Informe um e-mail válido.");

export const esquemaLogin = z.object({
  email,
  senha: z.string().min(1, "Informe sua senha."),
});

export const esquemaCadastro = z
  .object({
    email,
    senha: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
    confirmacaoSenha: z.string().min(1, "Confirme a senha."),
  })
  .refine((dados) => dados.senha === dados.confirmacaoSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmacaoSenha"],
  });

export type DadosLogin = z.infer<typeof esquemaLogin>;
export type DadosCadastro = z.infer<typeof esquemaCadastro>;
