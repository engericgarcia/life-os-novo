import { redirect } from "next/navigation";

/** A raiz sempre leva para a visão do dia; o middleware cuida da sessão. */
export default function Pagina() {
  redirect("/hoje");
}
