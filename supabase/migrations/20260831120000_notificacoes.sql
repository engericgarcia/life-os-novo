-- =============================================================================
-- life-os :: notificações push
--
-- Duas tabelas:
--   - push_subscriptions: um registro por navegador/aparelho inscrito.
--   - notification_preferences: se o usuário quer receber e a que horas.
--
-- O envio é feito por um trabalho agendado diário, que roda sem sessão de
-- usuário e por isso acessa estas tabelas com a service_role — a única parte
-- do sistema que ignora o RLS, e sempre no servidor.
-- =============================================================================

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Identifica unicamente o navegador/aparelho perante o serviço de push.
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  -- Quando o serviço de push recusa o endpoint (aparelho apagou o app, por
  -- exemplo), a inscrição é removida; este campo ajuda a depurar.
  last_success_at timestamptz,

  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

comment on table public.push_subscriptions is
  'Inscrições de push por navegador/aparelho. O endpoint é único globalmente.';

create index push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default true,
  -- Hora local (America/Sao_Paulo) a partir da qual o resumo pode sair.
  send_hour smallint not null default 8,
  -- Último dia em que o resumo foi enviado. É o que torna o envio idempotente:
  -- o trabalho agendado pode rodar de hora em hora ou uma vez ao dia, e ainda
  -- assim ninguém recebe duas vezes no mesmo dia.
  last_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notification_preferences_send_hour_check
    check (send_hour between 0 and 23)
);

comment on table public.notification_preferences is
  'Preferências de notificação por usuário. A hora é local (America/Sao_Paulo).';

create index notification_preferences_envio_idx
  on public.notification_preferences (send_hour, last_sent_on)
  where enabled;

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- O usuário gerencia as próprias inscrições e preferências. O trabalho
-- agendado não passa por aqui: usa a service_role, que ignora RLS.
-- -----------------------------------------------------------------------------

alter table public.push_subscriptions enable row level security;

create policy "Usuário lê as próprias inscrições"
  on public.push_subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria as próprias inscrições"
  on public.push_subscriptions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Usuário remove as próprias inscrições"
  on public.push_subscriptions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

alter table public.notification_preferences enable row level security;

create policy "Usuário lê as próprias preferências"
  on public.notification_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria as próprias preferências"
  on public.notification_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Usuário edita as próprias preferências"
  on public.notification_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
