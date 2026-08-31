import type { Metadata, Viewport } from "next";

import { ProvedorTema } from "@/components/layout/provedor-tema";
import { RegistrarServiceWorker } from "@/components/layout/registrar-service-worker";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "life-os",
    template: "%s · life-os",
  },
  description:
    "Sistema pessoal de organização: tarefas, hábitos e a visão do seu dia.",
  applicationName: "life-os",
  // Faz o iOS abrir em tela cheia quando adicionado à tela de início.
  appleWebApp: {
    capable: true,
    title: "life-os",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Permite que o app ocupe a área do notch; o layout compensa com
  // env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ProvedorTema>
          {children}
          <Toaster />
        </ProvedorTema>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
