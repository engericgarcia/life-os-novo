"use client";

import * as React from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  removerInscricao,
  salvarInscricao,
} from "@/features/notifications/actions";

/**
 * A chave VAPID viaja em base64url e o navegador exige bytes crus.
 */
function paraBytes(base64url: string) {
  const preenchimento = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + preenchimento)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const binario = atob(base64);

  // O buffer é criado explicitamente para o tipo ser Uint8Array<ArrayBuffer>,
  // que é o que a API de push aceita como applicationServerKey.
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));

  for (let i = 0; i < binario.length; i += 1) {
    bytes[i] = binario.charCodeAt(i);
  }

  return bytes;
}

type Situacao =
  | "carregando"
  | "sem-suporte"
  | "precisa-instalar"
  | "bloqueado"
  | "inscrito"
  | "nao-inscrito";

/** No iOS, push só funciona com o app adicionado à tela de início. */
function estaInstalado(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Propriedade só existente no Safari do iOS.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function ehIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function ControleNotificacoes({
  chavePublica,
}: {
  chavePublica: string | null;
}) {
  const [situacao, setSituacao] = React.useState<Situacao>("carregando");
  const [ocupado, setOcupado] = React.useState(false);

  const avaliar = React.useCallback(async () => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setSituacao(
        ehIOS() && !estaInstalado() ? "precisa-instalar" : "sem-suporte",
      );
      return;
    }

    if (ehIOS() && !estaInstalado()) {
      setSituacao("precisa-instalar");
      return;
    }

    if (Notification.permission === "denied") {
      setSituacao("bloqueado");
      return;
    }

    const registro = await navigator.serviceWorker.ready;
    const inscricao = await registro.pushManager.getSubscription();

    setSituacao(inscricao ? "inscrito" : "nao-inscrito");
  }, []);

  React.useEffect(() => {
    avaliar().catch(() => setSituacao("sem-suporte"));
  }, [avaliar]);

  async function ativar() {
    if (!chavePublica) return;

    setOcupado(true);

    try {
      const permissao = await Notification.requestPermission();

      if (permissao !== "granted") {
        setSituacao(permissao === "denied" ? "bloqueado" : "nao-inscrito");
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: paraBytes(chavePublica),
      });

      const dados = inscricao.toJSON();
      const resultado = await salvarInscricao({
        endpoint: inscricao.endpoint,
        p256dh: dados.keys?.p256dh ?? "",
        auth: dados.keys?.auth ?? "",
      });

      if (!resultado.ok) {
        // Não deixa a inscrição órfã no navegador se o servidor recusou.
        await inscricao.unsubscribe();
        toast.error(resultado.erro);
        setSituacao("nao-inscrito");
        return;
      }

      toast.success("Notificações ativadas neste aparelho.");
      setSituacao("inscrito");
    } catch (erro) {
      console.error("[life-os] falha ao ativar notificações", erro);
      toast.error("Não foi possível ativar as notificações neste aparelho.");
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    setOcupado(true);

    try {
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();

      if (inscricao) {
        await removerInscricao(inscricao.endpoint);
        await inscricao.unsubscribe();
      }

      toast.success("Notificações desativadas neste aparelho.");
      setSituacao("nao-inscrito");
    } catch (erro) {
      console.error("[life-os] falha ao desativar notificações", erro);
      toast.error("Não foi possível desativar as notificações.");
    } finally {
      setOcupado(false);
    }
  }

  if (!chavePublica) {
    return (
      <p className="text-muted-foreground text-sm">
        As notificações não estão configuradas neste ambiente — falta a chave
        VAPID.
      </p>
    );
  }

  if (situacao === "carregando") {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Verificando este aparelho…
      </p>
    );
  }

  if (situacao === "precisa-instalar") {
    return (
      <p className="text-muted-foreground text-sm">
        No iPhone, as notificações só funcionam com o app adicionado à tela de
        início. Toque em compartilhar, escolha{" "}
        <strong className="text-foreground">Adicionar à Tela de Início</strong>{" "}
        e abra o life-os pelo ícone.
      </p>
    );
  }

  if (situacao === "sem-suporte") {
    return (
      <p className="text-muted-foreground text-sm">
        Este navegador não suporta notificações push.
      </p>
    );
  }

  if (situacao === "bloqueado") {
    return (
      <p className="text-muted-foreground text-sm">
        As notificações foram bloqueadas para este site. Para reativar, ajuste a
        permissão nas configurações do navegador e recarregue a página.
      </p>
    );
  }

  return situacao === "inscrito" ? (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <BellRing className="text-primary size-4" />
        Este aparelho recebe notificações.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={desativar}
        disabled={ocupado}
        className="self-start"
      >
        {ocupado ? <Loader2 className="animate-spin" /> : <BellOff />}
        Desativar neste aparelho
      </Button>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <BellOff className="size-4" />
        Este aparelho não recebe notificações.
      </p>
      <Button
        size="sm"
        onClick={ativar}
        disabled={ocupado}
        className="self-start"
      >
        {ocupado ? <Loader2 className="animate-spin" /> : <BellRing />}
        Ativar neste aparelho
      </Button>
    </div>
  );
}
