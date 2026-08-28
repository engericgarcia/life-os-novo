"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  FolderOpen,
  ListChecks,
  Repeat2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ItemNavegacao = {
  href: string;
  rotulo: string;
  Icone: LucideIcon;
};

const ITENS: ItemNavegacao[] = [
  { href: "/hoje", rotulo: "Hoje", Icone: CalendarCheck },
  { href: "/tarefas", rotulo: "Tarefas", Icone: ListChecks },
  { href: "/habitos", rotulo: "Hábitos", Icone: Repeat2 },
  { href: "/areas", rotulo: "Áreas", Icone: FolderOpen },
];

function estaAtivo(caminho: string, href: string): boolean {
  return caminho === href || caminho.startsWith(`${href}/`);
}

/** Navegação lateral — visível a partir de md. */
export function NavegacaoLateral() {
  const caminho = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Navegação principal">
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = estaAtivo(caminho, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              ativo
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icone className="size-4 shrink-0" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

/** Barra inferior — a navegação principal no celular. */
export function NavegacaoInferior() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {ITENS.map(({ href, rotulo, Icone }) => {
          const ativo = estaAtivo(caminho, href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors",
                  ativo
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icone className="size-5" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
