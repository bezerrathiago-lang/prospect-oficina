-- ============================================================
-- ProspectMoto — Schema PostgreSQL (Supabase)
-- Migração completa: tabelas, funções de negócio, RLS, seeds
-- ============================================================

-- ── Tabelas ─────────────────────────────────────────────────

-- profiles: espelha auth.users com nome e papel
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'consultant' check (role in ('consultant','manager')),
  created_at timestamptz not null default now()
);

create table public.service_types (
  id bigint generated always as identity primary key,
  name text not null,
  contact_lead_days int not null default 5,  -- dias úteis de antecedência
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.abandonment_reasons (
  id bigint generated always as identity primary key,
  label text not null,
  is_other boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_records (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public.customers(id),
  service_type_id bigint not null references public.service_types(id),
  consultant_id uuid not null references auth.users(id),
  service_description text not null default '',
  last_service_date date not null,
  last_service_mileage int not null,
  current_mileage int not null,
  current_mileage_date date,
  next_service_mileage int not null,
  next_service_date date not null,
  daily_average_km real not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id bigint generated always as identity primary key,
  service_record_id bigint not null references public.service_records(id),
  customer_id bigint not null references public.customers(id),
  consultant_id uuid not null references auth.users(id),
  scheduled_date date not null,
  status text not null default 'pending'
    check (status in ('pending','completed_scheduled','completed_rescheduled','abandoned')),
  attempt_count int not null default 0,
  appointment_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tasks_consultant_date on public.tasks(consultant_id, scheduled_date);

create table public.contact_attempts (
  id bigint generated always as identity primary key,
  task_id bigint not null references public.tasks(id),
  consultant_id uuid not null references auth.users(id),
  outcome text not null check (outcome in ('scheduled','rescheduled','abandoned','remeasured')),
  appointment_date date,
  rescheduled_date date,
  new_mileage int,
  next_task_id bigint references public.tasks(id),
  abandonment_reason_id bigint references public.abandonment_reasons(id),
  abandonment_notes text,
  created_at timestamptz not null default now()
);

-- ── Helpers ─────────────────────────────────────────────────

-- Subtrai N dias úteis de uma data (pula sábado e domingo)
create or replace function public.subtract_business_days(d date, n int)
returns date language plpgsql immutable as $$
declare
  result date := d;
  remaining int := n;
begin
  while remaining > 0 loop
    result := result - 1;
    if extract(isodow from result) < 6 then  -- 1..5 = seg..sex
      remaining := remaining - 1;
    end if;
  end loop;
  return result;
end;
$$;

-- Retorna true se o usuário autenticado é gestor
create or replace function public.is_manager()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'manager');
$$;

-- Cria profile automaticamente ao criar usuário no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuário'),
    coalesce(new.raw_user_meta_data->>'role', 'consultant')
  )
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RPC: criar atendimento (com previsão + tarefa) ──────────

create or replace function public.create_service_record(
  p_customer_name text,
  p_customer_phone text,
  p_service_type_id bigint,
  p_service_description text,
  p_last_service_date date,
  p_last_service_mileage int,
  p_current_mileage int,
  p_next_service_mileage int
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_lead int;
  v_days_elapsed int;
  v_daily real;
  v_days_until int;
  v_next_date date;
  v_customer customers;
  v_record service_records;
  v_task tasks;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if length(trim(coalesce(p_service_description,''))) < 3 then
    raise exception 'Descrição do serviço é obrigatória.'; end if;
  if p_current_mileage <= p_last_service_mileage then
    raise exception 'Km atual deve ser maior que km do último serviço.'; end if;
  if p_next_service_mileage <= p_current_mileage then
    raise exception 'Km do próximo serviço deve ser maior que km atual.'; end if;
  if p_last_service_date >= current_date then
    raise exception 'Data do último serviço deve ser anterior a hoje.'; end if;

  select contact_lead_days into v_lead from service_types where id = p_service_type_id;
  if v_lead is null then raise exception 'Tipo de serviço não encontrado.'; end if;

  v_days_elapsed := current_date - p_last_service_date;
  v_daily := (p_current_mileage - p_last_service_mileage)::real / v_days_elapsed;
  v_days_until := ceil((p_next_service_mileage - p_current_mileage) / v_daily);
  v_next_date := current_date + v_days_until;

  select * into v_customer from customers where phone = p_customer_phone;
  if v_customer.id is null then
    insert into customers(name, phone) values (p_customer_name, p_customer_phone)
      returning * into v_customer;
  elsif v_customer.name <> p_customer_name then
    update customers set name = p_customer_name, updated_at = now()
      where id = v_customer.id returning * into v_customer;
  end if;

  insert into service_records(
    customer_id, service_type_id, consultant_id, service_description,
    last_service_date, last_service_mileage, current_mileage, current_mileage_date,
    next_service_mileage, next_service_date, daily_average_km
  ) values (
    v_customer.id, p_service_type_id, v_uid, p_service_description,
    p_last_service_date, p_last_service_mileage, p_current_mileage, current_date,
    p_next_service_mileage, v_next_date, round(v_daily::numeric, 1)
  ) returning * into v_record;

  insert into tasks(service_record_id, customer_id, consultant_id, scheduled_date, status, attempt_count)
  values (v_record.id, v_customer.id, v_uid, subtract_business_days(v_next_date, v_lead), 'pending', 0)
  returning * into v_task;

  return json_build_object(
    'service_record', row_to_json(v_record),
    'customer', row_to_json(v_customer),
    'task', row_to_json(v_task)
  );
end;
$$;

-- ── RPC: registrar resultado de contato (4 outcomes) ────────

create or replace function public.register_contact_attempt(
  p_task_id bigint,
  p_outcome text,
  p_appointment_date date default null,
  p_rescheduled_date date default null,
  p_new_mileage int default null,
  p_abandonment_reason_id bigint default null,
  p_abandonment_notes text default null
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_task tasks;
  v_record service_records;
  v_lead int;
  v_attempt contact_attempts;
  v_new_task tasks;
  v_prev_date date; v_prev_km int;
  v_days_elapsed int; v_daily real; v_days_until int; v_next_date date; v_sched date;
  v_is_other boolean;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  select * into v_task from tasks where id = p_task_id;
  if v_task.id is null then raise exception 'Tarefa não encontrada.'; end if;
  if v_task.consultant_id <> v_uid then raise exception 'Sem permissão.'; end if;
  if v_task.status <> 'pending' then raise exception 'Esta tarefa já foi encerrada.'; end if;

  if p_outcome = 'scheduled' then
    if p_appointment_date is null then raise exception 'Data do agendamento obrigatória.'; end if;
    insert into contact_attempts(task_id, consultant_id, outcome, appointment_date)
      values (p_task_id, v_uid, 'scheduled', p_appointment_date) returning * into v_attempt;
    update tasks set status='completed_scheduled', appointment_date=p_appointment_date,
      attempt_count=attempt_count+1, completed_at=now(), updated_at=now() where id=p_task_id;
    return json_build_object('id', v_attempt.id, 'task_id', p_task_id, 'outcome', 'scheduled');

  elsif p_outcome = 'rescheduled' then
    if p_rescheduled_date is null or p_rescheduled_date <= current_date then
      raise exception 'A nova data deve ser a partir de amanhã.'; end if;
    insert into contact_attempts(task_id, consultant_id, outcome, rescheduled_date)
      values (p_task_id, v_uid, 'rescheduled', p_rescheduled_date) returning * into v_attempt;
    update tasks set status='completed_rescheduled', completed_at=now(), updated_at=now() where id=p_task_id;
    insert into tasks(service_record_id, customer_id, consultant_id, scheduled_date, status, attempt_count)
      values (v_task.service_record_id, v_task.customer_id, v_uid, p_rescheduled_date, 'pending', v_task.attempt_count+1)
      returning * into v_new_task;
    update contact_attempts set next_task_id=v_new_task.id where id=v_attempt.id;
    return json_build_object('id', v_attempt.id, 'task_id', p_task_id, 'outcome', 'rescheduled', 'next_task_id', v_new_task.id);

  elsif p_outcome = 'remeasured' then
    if p_new_mileage is null then raise exception 'Quilometragem atual é obrigatória.'; end if;
    select * into v_record from service_records where id = v_task.service_record_id;
    select contact_lead_days into v_lead from service_types where id = v_record.service_type_id;
    v_lead := coalesce(v_lead, 5);
    v_prev_date := coalesce(v_record.current_mileage_date, v_record.last_service_date);
    v_prev_km := v_record.current_mileage;
    if p_new_mileage <= v_prev_km then
      raise exception 'A nova km deve ser maior que a última km registrada.'; end if;
    if p_new_mileage >= v_record.next_service_mileage then
      raise exception 'A km informada já atingiu a meta do próximo serviço — registre o agendamento.'; end if;
    v_days_elapsed := current_date - v_prev_date;
    if v_days_elapsed <= 0 then
      raise exception 'Não há intervalo suficiente entre as leituras para recalcular.'; end if;
    v_daily := (p_new_mileage - v_prev_km)::real / v_days_elapsed;
    v_days_until := ceil((v_record.next_service_mileage - p_new_mileage) / v_daily);
    v_next_date := current_date + v_days_until;
    v_sched := subtract_business_days(v_next_date, v_lead);
    update service_records set
      last_service_date=v_prev_date, last_service_mileage=v_prev_km,
      current_mileage=p_new_mileage, current_mileage_date=current_date,
      next_service_date=v_next_date, daily_average_km=round(v_daily::numeric,1), updated_at=now()
      where id=v_record.id;
    insert into contact_attempts(task_id, consultant_id, outcome, new_mileage, rescheduled_date)
      values (p_task_id, v_uid, 'remeasured', p_new_mileage, v_sched) returning * into v_attempt;
    update tasks set status='completed_rescheduled', attempt_count=attempt_count+1,
      completed_at=now(), updated_at=now() where id=p_task_id;
    insert into tasks(service_record_id, customer_id, consultant_id, scheduled_date, status, attempt_count)
      values (v_task.service_record_id, v_task.customer_id, v_uid, v_sched, 'pending', v_task.attempt_count+1)
      returning * into v_new_task;
    update contact_attempts set next_task_id=v_new_task.id where id=v_attempt.id;
    return json_build_object('id', v_attempt.id, 'task_id', p_task_id, 'outcome', 'remeasured', 'next_task_id', v_new_task.id);

  elsif p_outcome = 'abandoned' then
    if p_abandonment_reason_id is null then raise exception 'Motivo de desistência é obrigatório.'; end if;
    select is_other into v_is_other from abandonment_reasons where id = p_abandonment_reason_id;
    if v_is_other is null then raise exception 'Motivo de desistência não encontrado.'; end if;
    if v_is_other and (p_abandonment_notes is null or length(trim(p_abandonment_notes)) < 5) then
      raise exception 'Descreva o motivo (mínimo 5 caracteres).'; end if;
    insert into contact_attempts(task_id, consultant_id, outcome, abandonment_reason_id, abandonment_notes)
      values (p_task_id, v_uid, 'abandoned', p_abandonment_reason_id, p_abandonment_notes) returning * into v_attempt;
    update tasks set status='abandoned', attempt_count=attempt_count+1,
      completed_at=now(), updated_at=now() where id=p_task_id;
    return json_build_object('id', v_attempt.id, 'task_id', p_task_id, 'outcome', 'abandoned');

  else
    raise exception 'Resultado inválido.';
  end if;
end;
$$;

-- ── Row Level Security ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.service_types enable row level security;
alter table public.abandonment_reasons enable row level security;
alter table public.customers enable row level security;
alter table public.service_records enable row level security;
alter table public.tasks enable row level security;
alter table public.contact_attempts enable row level security;

-- profiles: usuário lê o próprio; gestor lê todos
create policy "profiles_select" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_manager());

-- service_types: todos autenticados leem; só gestor escreve
create policy "st_select" on public.service_types for select to authenticated using (true);
create policy "st_insert" on public.service_types for insert to authenticated with check (public.is_manager());
create policy "st_update" on public.service_types for update to authenticated using (public.is_manager());

-- abandonment_reasons: idem
create policy "ar_select" on public.abandonment_reasons for select to authenticated using (true);
create policy "ar_insert" on public.abandonment_reasons for insert to authenticated with check (public.is_manager());
create policy "ar_update" on public.abandonment_reasons for update to authenticated using (public.is_manager());

-- customers / service_records / tasks / contact_attempts:
-- leitura liberada para usuários autenticados (app interno da oficina);
-- escrita ocorre exclusivamente via funções RPC (security definer)
create policy "cust_select" on public.customers for select to authenticated using (true);
create policy "sr_select" on public.service_records for select to authenticated using (true);
create policy "tasks_select" on public.tasks for select to authenticated using (true);
create policy "ca_select" on public.contact_attempts for select to authenticated using (true);

-- ── Seeds ───────────────────────────────────────────────────

insert into public.service_types(name, contact_lead_days) values
  ('Revisão', 5),
  ('Troca de Peças', 5);

insert into public.abandonment_reasons(label, is_other, sort_order) values
  ('Cliente sem interesse', false, 1),
  ('Telefone inválido ou não atende', false, 2),
  ('Cliente foi para outra oficina', false, 3),
  ('Muitas tentativas sem retorno', false, 4),
  ('Cliente solicitou não ser contatado', false, 5),
  ('Outros', true, 6);
