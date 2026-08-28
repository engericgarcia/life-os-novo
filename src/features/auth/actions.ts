"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { criarClienteServidor } from "@/lib/supabase/server";
import { errosPorCampo, texto } from "@/lib/validation";

import { esquemaCadastro, esquemaLogin } from "./schemas";

export type EstadoAuth = {
  erro?: string;
  mensagem?: string;
  errosPorCampo?: Record<string, string[]>;
};

/** Traduz os erros do Supabase Auth, que chegam em inglês. */
function traduzirErroAuth(mensagem: string): string {
  const traducoes: Array<[RegExp, string]> = [
    [/invalid login credentials/i, "E-mail ou senha incorretos."],
    [
      /email not confirmed/i,
      "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
    ],
    [/user already registered/i, "Já existe uma conta com este e-mail."],
    [
      /password should be at least/i,
      "A senha precisa ter ao menos 8 caracteres.",
    ],
    [
      /email rate limit exceeded|over_email_send_rate_limit/i,
      "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    ],
    [
      /for security purposes/i,
      "Muitas tentativas seguidas. Aguarde alguns segundos.",
    ],
  ];

  for (const [padrao, traducao] of traducoes) {
    if (padrao.test(mensagem)) return traducao;
  }

  return "Não foi possível concluir. Tente novamente.";
}

/** URL pública da aplicação, usada no link de confirmação de e-mail. */
async function obterOrigem(): Promise<string> {
  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host");
  const protocolo =
    cabecalhos.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");

  return `${protocolo}://${host ?? "localhost:3000"}`;
}

export async function entrar(
  _estadoAnterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const analise = esquemaLogin.safeParse({
    email: texto(formData, "email"),
    senha: texto(formData, "senha"),
  });

  if (!analise.success) {
    return { errosPorCampo: errosPorCampo(analise.error) };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: analise.data.email,
    password: analise.data.senha,
  });

  if (error) {
    console.error("[life-os] falha ao entrar", {
      status: error.status,
      message: error.message,
    });

    return { erro: traduzirErroAuth(error.message) };
  }

  const destino = texto(formData, "proximo");

  // redirect() lança internamente: precisa ficar fora de qualquer try/catch.
  redirect(destino.startsWith("/") ? destino : "/hoje");
}

export async function cadastrar(
  _estadoAnterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const analise = esquemaCadastro.safeParse({
    email: texto(formData, "email"),
    senha: texto(formData, "senha"),
    confirmacaoSenha: texto(formData, "confirmacaoSenha"),
  });

  if (!analise.success) {
    return { errosPorCampo: errosPorCampo(analise.error) };
  }

  const supabase = await criarClienteServidor();
  const origem = await obterOrigem();

  const { data, error } = await supabase.auth.signUp({
    email: analise.data.email,
    password: analise.data.senha,
    options: { emailRedirectTo: `${origem}/auth/confirmar` },
  });

  if (error) {
    console.error("[life-os] falha ao cadastrar", {
      status: error.status,
      message: error.message,
    });

    return { erro: traduzirErroAuth(error.message) };
  }

  // Com confirmação de e-mail desativada no Supabase, a sessão já vem pronta.
  if (data.session) {
    redirect("/hoje");
  }

  return {
    mensagem:
      "Conta criada. Enviamos um link de confirmação para o seu e-mail — " +
      "confirme para entrar.",
  };
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[life-os] falha ao sair", { message: error.message });
  }

  redirect("/entrar");
}
