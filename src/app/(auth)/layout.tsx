import { AlternadorTema } from "@/components/layout/alternador-tema";

export default function LayoutAutenticacao({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex justify-end p-4">
        <AlternadorTema />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">life-os</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Tarefas, hábitos e a visão do seu dia.
            </p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
