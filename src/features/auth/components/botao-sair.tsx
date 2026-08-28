import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sair } from "@/features/auth/actions";

/**
 * Sair é uma mutação: precisa de POST, então vai num form com Server Action
 * em vez de um link.
 */
export function BotaoSair() {
  return (
    <form action={sair}>
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        aria-label="Sair da conta"
        title="Sair"
      >
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
