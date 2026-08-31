-- =============================================================================
-- life-os :: anotações
--
-- Notas soltas do usuário, opcionalmente ligadas a uma área. Diferente da
-- descrição de uma tarefa, a anotação existe por si — ideias, listas, links,
-- o que não é "algo a fazer".
-- =============================================================================

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  area_id uuid references public.areas (id) on delete set null,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notes_title_length_check
    check (char_length(btrim(title)) between 1 and 140),
  constraint notes_content_length_check
    check (content is null or char_length(content) <= 20000)
);

comment on table public.notes is
  'Anotações do usuário, opcionalmente agrupadas por área.';

create index notes_user_id_idx on public.notes (user_id);

-- A lista é ordenada pela edição mais recente; o índice cobre esse caminho.
create index notes_user_updated_at_idx
  on public.notes (user_id, updated_at desc);

create index notes_area_id_idx on public.notes (area_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security: mesma regra das demais tabelas.
-- -----------------------------------------------------------------------------

alter table public.notes enable row level security;

create policy "Usuário lê as próprias anotações"
  on public.notes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria as próprias anotações"
  on public.notes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Usuário edita as próprias anotações"
  on public.notes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Usuário remove as próprias anotações"
  on public.notes for delete
  to authenticated
  using ((select auth.uid()) = user_id);
