import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA. O Next serve isto em /manifest.webmanifest e injeta a
 * tag <link rel="manifest"> automaticamente.
 *
 * `start_url` aponta para /hoje em vez de "/": quem instala o app quer cair
 * direto na visão do dia, e o middleware redireciona para /entrar se não
 * houver sessão.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "life-os",
    short_name: "life-os",
    description:
      "Sistema pessoal de organização: tarefas, hábitos e a visão do seu dia.",
    lang: "pt-BR",
    start_url: "/hoje",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // O Android recorta o ícone em círculo/squircle; a versão maskable tem
      // a margem de segurança necessária para o traço não ser cortado.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
