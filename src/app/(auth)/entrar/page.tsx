import type { Metadata } from "next";

import { FormularioLogin } from "@/features/auth/components/formulario-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const { proximo } = await searchParams;

  return <FormularioLogin proximo={proximo} />;
}
