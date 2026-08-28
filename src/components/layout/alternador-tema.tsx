"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AlternadorTema() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = React.useState(false);

  // O tema só é conhecido no cliente; renderizar antes disso causaria
  // divergência de hidratação.
  React.useEffect(() => setMontado(true), []);

  const escuro = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={escuro ? "Ativar tema claro" : "Ativar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
    >
      {montado ? (
        escuro ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <span className="size-4" />
      )}
    </Button>
  );
}
