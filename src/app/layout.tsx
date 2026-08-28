import type { Metadata, Viewport } from "next";

import { ProvedorTema } from "@/components/layout/provedor-tema";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      </body>
    </html>
  );
}
