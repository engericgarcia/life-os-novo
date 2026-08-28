import { type ZodError } from "zod";

/**
 * Converte um ZodError no formato consumido pelos formulários:
 * `{ campo: ["mensagem", ...] }`.
 */
export function errosPorCampo(erro: ZodError): Record<string, string[]> {
  const resultado: Record<string, string[]> = {};

  for (const problema of erro.issues) {
    const campo = problema.path.join(".") || "_";
    const atual = resultado[campo] ?? [];
    atual.push(problema.message);
    resultado[campo] = atual;
  }

  return resultado;
}

/** Lê um campo de texto do FormData, devolvendo string vazia quando ausente. */
export function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

/** Lê um campo opcional: string vazia vira `undefined`. */
export function textoOpcional(
  formData: FormData,
  campo: string,
): string | undefined {
  const valor = texto(formData, campo);
  return valor === "" ? undefined : valor;
}

/** Lê múltiplos valores (checkbox group) como números. */
export function numeros(formData: FormData, campo: string): number[] {
  return formData
    .getAll(campo)
    .filter((valor): valor is string => typeof valor === "string")
    .map((valor) => Number(valor))
    .filter((valor) => Number.isInteger(valor));
}
