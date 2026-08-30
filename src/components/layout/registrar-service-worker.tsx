"use client";

import * as React from "react";

/**
 * Registra o service worker que torna o app instalável.
 *
 * Só roda em produção: em desenvolvimento, um service worker ativo confunde
 * o hot reload e mascara mudanças que você acabou de fazer.
 */
export function RegistrarServiceWorker() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch((erro) => {
        console.error("[life-os] falha ao registrar o service worker", erro);
      });
    };

    // Espera o carregamento terminar para não competir por banda com o app.
    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar);
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
