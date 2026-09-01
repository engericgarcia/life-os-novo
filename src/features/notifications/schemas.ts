import { z } from "zod";

/** Formato devolvido por `PushSubscription.toJSON()` no navegador. */
export const esquemaInscricao = z.object({
  endpoint: z.string().url("Endpoint de push inválido."),
  p256dh: z.string().min(1, "Chave p256dh ausente."),
  auth: z.string().min(1, "Chave auth ausente."),
});

export const esquemaPreferencias = z.object({
  ativado: z.boolean(),
  horaDeEnvio: z
    .number()
    .int()
    .min(0, "Hora inválida.")
    .max(23, "Hora inválida."),
});

export type DadosInscricao = z.infer<typeof esquemaInscricao>;
