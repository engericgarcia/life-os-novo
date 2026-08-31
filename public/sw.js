/**
 * Service worker do life-os.
 *
 * Princípio central: **nunca cachear HTML de página**. O app é renderizado no
 * servidor e as telas contêm dados da sessão — servir uma cópia guardada
 * mostraria informação desatualizada, ou pior, de outra sessão.
 *
 * Portanto:
 *   - navegação  -> sempre rede; sem rede, mostra a página offline;
 *   - estáticos  -> cache primeiro (os arquivos do Next têm hash no nome,
 *                   então nunca ficam obsoletos);
 *   - resto      -> passa direto, sem interferência.
 */

// Troque a versão sempre que um arquivo pré-cacheado mudar: é o que faz o
// activate limpar os caches antigos. Sem isso, a página offline guardada
// continua sendo a da identidade anterior.
const VERSAO = "life-os-v2";
const PAGINA_OFFLINE = "/offline.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(VERSAO)
      .then((cache) => cache.addAll([PAGINA_OFFLINE]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((chave) => chave !== VERSAO)
            .map((chave) => caches.delete(chave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function ehEstaticoImutavel(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|svg|jpg|jpeg|webp|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;

  if (requisicao.method !== "GET") return;

  const url = new URL(requisicao.url);

  if (url.origin !== self.location.origin) return;

  if (requisicao.mode === "navigate") {
    evento.respondWith(
      fetch(requisicao).catch(() => caches.match(PAGINA_OFFLINE)),
    );
    return;
  }

  if (ehEstaticoImutavel(url)) {
    evento.respondWith(
      caches.match(requisicao).then((guardado) => {
        if (guardado) return guardado;

        return fetch(requisicao).then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(VERSAO).then((cache) => cache.put(requisicao, copia));
          }

          return resposta;
        });
      }),
    );
  }
});
