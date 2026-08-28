import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Destino do link de confirmação de e-mail enviado pelo Supabase.
 * Troca o token do link por uma sessão e leva o usuário para a visão do dia.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  const paraLogin = (motivo: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("erro", motivo);
    return NextResponse.redirect(url);
  };

  if (!tokenHash || !tipo) {
    return paraLogin("link-invalido");
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({
    type: tipo,
    token_hash: tokenHash,
  });

  if (error) {
    console.error("[life-os] falha ao confirmar e-mail", {
      status: error.status,
      message: error.message,
    });

    return paraLogin("link-expirado");
  }

  const url = request.nextUrl.clone();
  url.pathname = "/hoje";
  url.search = "";

  return NextResponse.redirect(url);
}
