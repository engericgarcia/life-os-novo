"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastrar, type EstadoAuth } from "@/features/auth/actions";

const ESTADO_INICIAL: EstadoAuth = {};

export function FormularioCadastro() {
  const [estado, acao, pendente] = useActionState(cadastrar, ESTADO_INICIAL);

  const erroEmail = estado.errosPorCampo?.email?.[0];
  const erroSenha = estado.errosPorCampo?.senha?.[0];
  const erroConfirmacao = estado.errosPorCampo?.confirmacaoSenha?.[0];

  if (estado.mensagem) {
    return (
      <div className="flex flex-col gap-4">
        <p className="border-primary/40 bg-primary/10 rounded-md border px-3 py-3 text-sm">
          {estado.mensagem}
        </p>
        <Button asChild variant="outline">
          <Link href="/entrar">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com"
          aria-invalid={Boolean(erroEmail)}
        />
        {erroEmail ? (
          <p className="text-destructive text-sm">{erroEmail}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(erroSenha)}
        />
        <p className="text-muted-foreground text-xs">Mínimo de 8 caracteres.</p>
        {erroSenha ? (
          <p className="text-destructive text-sm">{erroSenha}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmacaoSenha">Confirmar senha</Label>
        <Input
          id="confirmacaoSenha"
          name="confirmacaoSenha"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(erroConfirmacao)}
        />
        {erroConfirmacao ? (
          <p className="text-destructive text-sm">{erroConfirmacao}</p>
        ) : null}
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {estado.erro}
        </p>
      ) : null}

      <Button type="submit" disabled={pendente} className="mt-2">
        {pendente ? <Loader2 className="animate-spin" /> : null}
        Criar conta
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="text-primary font-medium hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
