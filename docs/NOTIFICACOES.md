# Notificações push

O life-os envia um resumo diário: o que vence hoje e quais hábitos ainda
faltam. Funciona no Android e no iPhone — neste último, apenas com o app
adicionado à tela de início, exigência do iOS.

## Como funciona

```
navegador                      servidor                    agendador
   │                              │                            │
   │  1. pede permissão           │                            │
   │  2. assina no serviço        │                            │
   │     de push do navegador     │                            │
   │ ───── endpoint + chaves ───► │                            │
   │                              │ grava em push_subscriptions│
   │                              │                            │
   │                              │ ◄──── de hora em hora ──── │
   │                              │  monta o resumo e envia    │
   │ ◄──── notificação ────────── │                            │
```

**Chaves VAPID** identificam este servidor perante os serviços de push
(Apple, Google, Mozilla). O par é gerado uma vez: a pública vai para o
navegador, a privada fica no servidor.

**O service worker** ([`public/sw.js`](../public/sw.js)) recebe o evento
`push` e exibe a notificação. O clique abre a tela `/hoje`, reusando a aba já
aberta em vez de criar outra.

## O envio é idempotente

O agendador roda **de hora em hora**, mas cada usuário recebe **no máximo uma
notificação por dia**. Quem garante isso é a coluna `last_sent_on`: a consulta
seleciona apenas quem está ligado, já passou da hora escolhida e ainda não
recebeu hoje.

Esse desenho foi escolhido de propósito, em vez de casar o horário exato com
o disparo do agendador:

- **Tolera a frequência do plano.** O plano gratuito da Vercel pode limitar
  quantas vezes o cron roda por dia. Se rodar menos, o resumo apenas sai mais
  tarde — ninguém fica sem receber.
- **Tolera repetição.** Se o agendador disparar duas vezes, ou se uma execução
  falhar no meio e for repetida, ninguém recebe duas notificações.

**Dia vazio não gera notificação.** Avisar que não há nada a fazer é ruído, e
ruído é o que faz as pessoas desligarem as notificações.

## A decisão da `service_role`

O trabalho agendado roda **sem sessão de usuário** e precisa varrer as
preferências e tarefas de todos para saber o que enviar. O Row Level Security,
por definição, impede isso: sem `auth.uid()`, nenhuma linha é visível.

Por isso este projeto usa a `service_role` — **em um único lugar**:
[`src/lib/supabase/admin.ts`](../src/lib/supabase/admin.ts), consumido apenas
pela rota `/api/cron/resumo-diario`.

As regras que sustentam essa exceção:

- a chave **nunca** leva prefixo `NEXT_PUBLIC_`, então o Next não a embute no
  pacote do navegador;
- o cliente administrativo **nunca** é importado de um Client Component;
- **nenhuma** requisição de usuário comum passa por ele;
- a rota é protegida por `CRON_SECRET` no cabeçalho `Authorization`; sem ele,
  responde 401.

Todo o resto do sistema continua acessando o banco pela sessão do usuário,
com o RLS ativo.

## Configuração

### 1. Gere as chaves

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 2. Preencha o `.env.local`

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:voce@exemplo.com
CRON_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

A `service_role` está em **Project Settings → API Keys → secret** no Supabase.

### 3. Repita na Vercel

As mesmas cinco variáveis em **Settings → Environment Variables**. O agendador
está declarado em [`vercel.json`](../vercel.json) e passa a existir no próximo
deploy.

> A Vercel injeta o `CRON_SECRET` como `Authorization: Bearer <valor>` nas
> chamadas agendadas. É por isso que a rota reconhece o agendador sem nenhuma
> configuração extra.

### 4. Ative no aparelho

Em **Ajustes** dentro do app, toque em *Ativar neste aparelho*. A permissão é
pedida pelo navegador, e a inscrição é por aparelho — o iPhone e o Android
precisam ser ativados separadamente.

## Testando sem esperar o horário

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://life-os-rouge-sigma.vercel.app/api/cron/resumo-diario
```

A resposta traz o que aconteceu:

```json
{
  "hoje": "2026-08-31",
  "horaAtual": 21,
  "candidatos": 1,
  "enviados": 1,
  "semNovidade": 0,
  "inscricoesRemovidas": 0
}
```

Para testar de novo no mesmo dia, zere o `last_sent_on` daquele usuário na
tabela `notification_preferences`.

## Inscrições que morrem

Quando um aparelho desinstala o app ou revoga a permissão, o serviço de push
responde **404** ou **410**. A rota trata isso como falha permanente e apaga a
inscrição — manter a linha só faria a próxima execução falhar de novo. Falhas
temporárias (rede, indisponibilidade) são registradas no log e a inscrição é
preservada.
