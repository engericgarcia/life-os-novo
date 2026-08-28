"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar, type EstadoAuth } from "@/features/auth/actions";

const ESTADO_INICIAL: EstadoAuth = {};

export function FormularioLogin({ proximo }: { proximo?: string }) {
  const [estado, acao, pendente] = useActionState(entrar, ESTADO_INICIAL);

  const erroEmail = estado.errosPorCampo?.email?.[0];
  const erroSenha = estado.errosPorCampo?.senha?.[0];

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      {proximo ? <input type="hidden" name="proximo" value={proximo} /> : null}

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
          aria-describedby={erroEmail ? "erro-email" : undefined}
        />
        {erroEmail ? (
          <p id="erro-email" className="text-sm text-destructive">
            {erroEmail}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(erroSenha)}
          aria-describedby={erroSenha ? "erro-senha" : undefined}
        />
        {erroSenha ? (
          <p id="erro-senha" className="text-sm text-destructive">
            {erroSenha}
          </p>
        ) : null}
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.erro}
        </p>
      ) : null}

      <Button type="submit" disabled={pendente} className="mt-2">
        {pendente ? <Loader2 className="animate-spin" /> : null}
        Entrar
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-primary hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
