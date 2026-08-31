import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuração do app Android.
 *
 * O life-os é renderizado no servidor (Server Components e Server Actions),
 * então não existe pacote estático para embarcar no aparelho: o app nativo
 * carrega a versão hospedada em `server.url`.
 *
 * A pasta `capacitor/www` guarda apenas a tela de fallback, exibida se o
 * servidor estiver inalcançável no primeiro carregamento.
 */
const config: CapacitorConfig = {
  appId: "app.lifeos",
  appName: "life-os",
  webDir: "capacitor/www",
  server: {
    url: "https://life-os-rouge-sigma.vercel.app",
    // Só HTTPS: nada de tráfego em texto puro.
    cleartext: false,
  },
  android: {
    backgroundColor: "#ffffff",
  },
};

export default config;
