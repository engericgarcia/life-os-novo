-- =============================================================================
-- life-os :: esquema inicial
--
-- Tabelas: areas, tasks, task_occurrences, habits, habit_checkins.
-- Todas pertencem a um usuário (user_id -> auth.users) e têm RLS habilitado
-- na migration seguinte (20260828120100_rls_policies.sql).
--
-- Modelo de recorrência (detalhes em docs/RECORRENCIA.md):
--   - `tasks` guarda a REGRA de recorrência (diária/semanal/mensal).
--   - `task_occurrences` guarda o ESTADO de cada ocorrência (data + status).
--   - Tarefa sem recorrência guarda o próprio estado em `tasks`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------

create type public.task_priority as enum ('baixa', 'media', 'alta');

create type public.task_status as enum ('pendente', 'concluida');

create type public.recurrence_type as enum ('diaria', 'semanal', 'mensal');

-- -----------------------------------------------------------------------------
-- Função utilitária: mantém updated_at sempre atualizado
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- areas :: agrupadores das tarefas (Trabalho, Faculdade, Pessoal, ...)
-- -----------------------------------------------------------------------------

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint areas_name_length_check
    check (char_length(btrim(name)) between 1 and 60),
  constraint areas_color_format_check
    check (color ~* '^#[0-9a-f]{6}$'),
  constraint areas_user_name_unique unique (user_id, name)
);

comment on table public.areas is
  'Agrupadores de tarefas definidos pelo usuário.';

create index areas_user_id_idx on public.areas (user_id);

create trigger areas_set_updated_at
  before update on public.areas
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- tasks :: tarefa simples OU regra de uma tarefa recorrente
-- -----------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  area_id uuid references public.areas (id) on delete set null,
  title text not null,
  description text,
  priority public.task_priority not null default 'media',
  status public.task_status not null default 'pendente',
  due_date date,
  completed_at timestamptz,

  -- Recorrência: null = tarefa simples (não recorrente).
  recurrence public.recurrence_type,
  -- Semanal: dias da semana, 0 = domingo ... 6 = sábado.
  recurrence_weekdays smallint[],
  -- Mensal: dia fixo do mês (1..31; meses curtos usam o último dia).
  recurrence_day_of_month smallint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_title_length_check
    check (char_length(btrim(title)) between 1 and 140),
  constraint tasks_description_length_check
    check (description is null or char_length(description) <= 2000),

  -- status e completed_at nunca divergem
  constraint tasks_status_completed_at_check check (
    (status = 'concluida' and completed_at is not null)
    or (status = 'pendente' and completed_at is null)
  ),

  -- cada tipo de recorrência exige exatamente os seus campos
  constraint tasks_recurrence_fields_check check (
    (
      recurrence is null
      and recurrence_weekdays is null
      and recurrence_day_of_month is null
    )
    or (
      recurrence = 'diaria'
      and recurrence_weekdays is null
      and recurrence_day_of_month is null
    )
    or (
      recurrence = 'semanal'
      and recurrence_weekdays is not null
      and array_length(recurrence_weekdays, 1) between 1 and 7
      and recurrence_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
      and recurrence_day_of_month is null
    )
    or (
      recurrence = 'mensal'
      and recurrence_weekdays is null
      and recurrence_day_of_month between 1 and 31
    )
  ),

  -- tarefa recorrente precisa de uma data âncora (a 1ª ocorrência)
  constraint tasks_recurring_requires_due_date_check
    check (recurrence is null or due_date is not null),

  -- em tarefa recorrente o estado vive nas ocorrências, nunca na regra
  constraint tasks_recurring_status_check
    check (recurrence is null or status = 'pendente')
);

comment on table public.tasks is
  'Tarefa simples ou regra de recorrência. Quando recurrence não é nulo, o '
  'estado de conclusão fica em task_occurrences.';

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_user_status_due_date_idx
  on public.tasks (user_id, status, due_date);
create index tasks_user_due_date_idx
  on public.tasks (user_id, due_date)
  where due_date is not null;
create index tasks_area_id_idx on public.tasks (area_id);
create index tasks_user_recurring_idx
  on public.tasks (user_id)
  where recurrence is not null;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- task_occurrences :: instâncias datadas de uma tarefa recorrente
-- -----------------------------------------------------------------------------

create table public.task_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  due_date date not null,
  status public.task_status not null default 'pendente',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint task_occurrences_status_completed_at_check check (
    (status = 'concluida' and completed_at is not null)
    or (status = 'pendente' and completed_at is null)
  ),
  -- a mesma tarefa nunca gera duas ocorrências para a mesma data
  constraint task_occurrences_task_due_date_unique unique (task_id, due_date)
);

comment on table public.task_occurrences is
  'Uma ocorrência datada de uma tarefa recorrente. A próxima ocorrência é '
  'criada quando a atual é concluída.';

create index task_occurrences_user_due_date_idx
  on public.task_occurrences (user_id, due_date);
create index task_occurrences_user_status_due_date_idx
  on public.task_occurrences (user_id, status, due_date);
create index task_occurrences_task_id_idx
  on public.task_occurrences (task_id);

create trigger task_occurrences_set_updated_at
  before update on public.task_occurrences
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- habits :: hábito com frequência alvo por dia da semana
-- -----------------------------------------------------------------------------

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#22c55e',
  -- dias em que o hábito deve ser cumprido: 0 = domingo ... 6 = sábado
  target_weekdays smallint[] not null
    default array[0, 1, 2, 3, 4, 5, 6]::smallint[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint habits_name_length_check
    check (char_length(btrim(name)) between 1 and 60),
  constraint habits_color_format_check
    check (color ~* '^#[0-9a-f]{6}$'),
  constraint habits_target_weekdays_check check (
    array_length(target_weekdays, 1) between 1 and 7
    and target_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  constraint habits_user_name_unique unique (user_id, name)
);

comment on table public.habits is
  'Hábito com frequência alvo definida por dias da semana.';

create index habits_user_id_idx on public.habits (user_id);

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- habit_checkins :: um check-in por hábito por dia
-- -----------------------------------------------------------------------------

create table public.habit_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  -- data local do usuário (America/Sao_Paulo), calculada na aplicação
  date date not null,
  created_at timestamptz not null default now(),

  constraint habit_checkins_habit_date_unique unique (habit_id, date)
);

comment on table public.habit_checkins is
  'Marcação de que o hábito foi cumprido em um dia. A data é o dia local do '
  'usuário (America/Sao_Paulo), resolvido na aplicação.';

create index habit_checkins_user_date_idx
  on public.habit_checkins (user_id, date);
create index habit_checkins_habit_id_idx
  on public.habit_checkins (habit_id);
