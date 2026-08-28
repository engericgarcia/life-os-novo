-- =============================================================================
-- life-os :: Row Level Security
--
-- Regra única e uniforme: cada usuário só enxerga e altera as linhas em que
-- user_id = auth.uid(). Nenhuma tabela é acessível sem sessão autenticada.
--
-- `(select auth.uid())` (em vez de `auth.uid()`) permite ao Postgres avaliar a
-- função uma única vez por query em vez de uma vez por linha.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- areas
-- -----------------------------------------------------------------------------

alter table public.areas enable row level security;

create policy "Usuário lê as próprias áreas"
  on public.areas for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria as próprias áreas"
  on public.areas for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Usuário edita as próprias áreas"
  on public.areas for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Usuário remove as próprias áreas"
  on public.areas for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- tasks
-- -----------------------------------------------------------------------------

alter table public.tasks enable row level security;

create policy "Usuário lê as próprias tarefas"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria as próprias tarefas"
  on public.tasks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Usuário edita as próprias tarefas"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Usuário remove as próprias tarefas"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- task_occurrences
--
-- Além de user_id, o insert exige que a tarefa referenciada também pertença ao
-- usuário, impedindo pendurar ocorrências em tarefas de outra pessoa.
-- -----------------------------------------------------------------------------

alter table public.task_occurrences enable row level security;

create policy "Usuário lê as próprias ocorrências"
  on public.task_occurrences for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria as próprias ocorrências"
  on public.task_occurrences for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and t.user_id = (select auth.uid())
    )
  );

create policy "Usuário edita as próprias ocorrências"
  on public.task_occurrences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Usuário remove as próprias ocorrências"
  on public.task_occurrences for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- habits
-- -----------------------------------------------------------------------------

alter table public.habits enable row level security;

create policy "Usuário lê os próprios hábitos"
  on public.habits for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria os próprios hábitos"
  on public.habits for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Usuário edita os próprios hábitos"
  on public.habits for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Usuário remove os próprios hábitos"
  on public.habits for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- habit_checkins
-- -----------------------------------------------------------------------------

alter table public.habit_checkins enable row level security;

create policy "Usuário lê os próprios check-ins"
  on public.habit_checkins for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria os próprios check-ins"
  on public.habit_checkins for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.habits h
      where h.id = habit_id
        and h.user_id = (select auth.uid())
    )
  );

create policy "Usuário remove os próprios check-ins"
  on public.habit_checkins for delete
  to authenticated
  using ((select auth.uid()) = user_id);
