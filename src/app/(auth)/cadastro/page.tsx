import type { Metadata } from "next";

import { FormularioCadastro } from "@/features/auth/components/formulario-cadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaCadastro() {
  return <FormularioCadastro />;
}
