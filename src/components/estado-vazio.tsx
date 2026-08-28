import * as React from "react";

export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="border-border flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{titulo}</p>
      <p className="text-muted-foreground max-w-sm text-sm">{descricao}</p>
      {acao ? <div className="mt-3">{acao}</div> : null}
    </div>
  );
}
