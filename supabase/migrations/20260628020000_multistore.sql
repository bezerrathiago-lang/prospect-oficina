-- ============================================================
-- ProspectMoto — Multi-loja + papéis (Admin / Gerente / Consultor)
-- Lojas, isolamento de dados por loja (RLS), criação de usuários
-- ============================================================

-- ── Tabela de lojas ─────────────────────────────────────────
create table if not exists public.stores (
  id bigint generated always as identity primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.stores (name)
select v.name from (values
  ('Cirne Matriz'), ('Cirne Zona Norte'), ('Cirne Macau'), ('Cirne Ceará-Mirim')
) as v(name)
where not exists (select 1 from public.stores s where s.name = v.name);

-- ── Papel admin + store_id no profile ───────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('consultant','manager','admin'));
alter table public.profiles add column if not exists store_id bigint references public.stores(id);

-- ── store_id nas tabelas de dados ───────────────────────────
alter table public.customers add column if not exists store_id bigint references public.stores(id);
alter table public.service_records add column if not exists store_id bigint references public.stores(id);
alter table public.tasks add column if not exists store_id bigint references public.stores(id);

-- Atribuir registros existentes à Matriz
update public.customers set store_id = (select id from public.stores where name='Cirne Matriz') where store_id is null;
update public.service_records set store_id = (select id from public.stores where name='Cirne Matriz') where store_id is null;
update public.tasks set store_id = (select id from public.stores where name='Cirne Matriz') where store_id is null;

-- Cliente é único por (loja, telefone)
alter table public.customers drop constraint if exists customers_phone_key;
create unique index if not exists customers_store_phone_key on public.customers(store_id, phone);

-- ── Helpers ─────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.current_store_id()
returns bigint language sql security definer stable set search_path = public as $$
  select store_id from public.profiles where id = auth.uid();
$$;

-- ── Promover o gestor atual a Admin ─────────────────────────
update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'bezerra@cirnemotos.com.br');
update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
  where email = 'bezerra@cirnemotos.com.br';

-- ── Trigger de profile: agora com store_id ──────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, name, role, store_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuário'),
    coalesce(new.raw_user_meta_data->>'role', 'consultant'),
    nullif(new.raw_user_meta_data->>'store_id', '')::bigint
  )
  on conflict (id) do update set
    name = excluded.name, role = excluded.role, store_id = excluded.store_id;
  return new;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────
alter table public.stores enable row level security;
create policy "stores_select" on public.stores for select to authenticated using (true);
create policy "stores_insert" on public.stores for insert to authenticated with check (is_admin());
create policy "stores_update" on public.stores for update to authenticated using (is_admin());

-- Isolamento por loja (admin e gerente veem tudo)
drop policy if exists "cust_select" on public.customers;
create policy "cust_select" on public.customers for select to authenticated
  using (is_admin() or is_manager() or store_id = current_store_id());

drop policy if exists "sr_select" on public.service_records;
create policy "sr_select" on public.service_records for select to authenticated
  using (is_admin() or is_manager() or store_id = current_store_id());

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks for select to authenticated
  using (is_admin() or is_manager() or store_id = current_store_id());

-- profiles: admin/gerente leem todos (gestão); usuário lê o próprio
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or is_admin() or is_manager());
create policy "profiles_update_admin" on public.profiles for update to authenticated using (is_admin());

-- Configurações (tipos/motivos) agora só Admin escreve
drop policy if exists "st_insert" on public.service_types;
drop policy if exists "st_update" on public.service_types;
create policy "st_insert" on public.service_types for insert to authenticated with check (is_admin());
create policy "st_update" on public.service_types for update to authenticated using (is_admin());

drop policy if exists "ar_insert" on public.abandonment_reasons;
drop policy if exists "ar_update" on public.abandonment_reasons;
create policy "ar_insert" on public.abandonment_reasons for insert to authenticated with check (is_admin());
create policy "ar_update" on public.abandonment_reasons for update to authenticated using (is_admin());

-- ── create_service_record: agora com loja ───────────────────
drop function if exists public.create_service_record(text, text, bigint, text, text, text, date, int, int, int);

create or replace function public.create_service_record(
  p_customer_name text,
  p_customer_phone text,
  p_service_type_id bigint,
  p_service_description text,
  p_motorcycle_plate text,
  p_motorcycle_model text,
  p_last_service_date date,
  p_last_service_mileage int,
  p_current_mileage int,
  p_next_service_mileage int,
  p_store_id bigint default null
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_store bigint := coalesce(p_store_id, current_store_id());
  v_lead int;
  v_days_elapsed int; v_daily real; v_days_until int; v_next_date date;
  v_customer customers; v_record service_records; v_task tasks;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if v_store is null then raise exception 'Informe a loja do atendimento.'; end if;
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

  select * into v_customer from customers where phone = p_customer_phone and store_id = v_store;
  if v_customer.id is null then
    insert into customers(name, phone, store_id) values (p_customer_name, p_customer_phone, v_store)
      returning * into v_customer;
  elsif v_customer.name <> p_customer_name then
    update customers set name = p_customer_name, updated_at = now()
      where id = v_customer.id returning * into v_customer;
  end if;

  insert into service_records(
    customer_id, service_type_id, consultant_id, store_id, service_description,
    motorcycle_plate, motorcycle_model,
    last_service_date, last_service_mileage, current_mileage, current_mileage_date,
    next_service_mileage, next_service_date, daily_average_km
  ) values (
    v_customer.id, p_service_type_id, v_uid, v_store, p_service_description,
    upper(trim(coalesce(p_motorcycle_plate,''))), trim(coalesce(p_motorcycle_model,'')),
    p_last_service_date, p_last_service_mileage, p_current_mileage, current_date,
    p_next_service_mileage, v_next_date, round(v_daily::numeric, 1)
  ) returning * into v_record;

  insert into tasks(service_record_id, customer_id, consultant_id, store_id, scheduled_date, status, attempt_count)
  values (v_record.id, v_customer.id, v_uid, v_store, subtract_business_days(v_next_date, v_lead), 'pending', 0)
  returning * into v_task;

  return json_build_object(
    'service_record', row_to_json(v_record),
    'customer', row_to_json(v_customer),
    'task', row_to_json(v_task)
  );
end;
$$;

-- ── renew_prospection: herda a loja do registro anterior ────
drop function if exists public.renew_prospection(bigint, text, bigint, text, date, int, int, int);

create or replace function public.renew_prospection(
  p_task_id bigint,
  p_scenario text,
  p_service_type_id bigint,
  p_service_description text,
  p_last_service_date date,
  p_last_service_mileage int,
  p_current_mileage int,
  p_next_service_mileage int
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_task tasks; v_old_record service_records; v_lead int;
  v_days_elapsed int; v_daily real; v_days_until int; v_next_date date;
  v_record service_records; v_new_task tasks; v_attempt contact_attempts;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  select * into v_task from tasks where id = p_task_id;
  if v_task.id is null then raise exception 'Tarefa não encontrada.'; end if;
  if v_task.consultant_id <> v_uid and not is_admin() and not is_manager() then
    raise exception 'Sem permissão.'; end if;
  if v_task.status <> 'pending' then raise exception 'Esta tarefa já foi encerrada.'; end if;
  if coalesce(trim(p_scenario), '') = '' then raise exception 'Informe o cenário da nova prospecção.'; end if;

  select * into v_old_record from service_records where id = v_task.service_record_id;

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

  insert into service_records(
    customer_id, service_type_id, consultant_id, store_id, service_description,
    motorcycle_plate, motorcycle_model,
    last_service_date, last_service_mileage, current_mileage, current_mileage_date,
    next_service_mileage, next_service_date, daily_average_km
  ) values (
    v_old_record.customer_id, p_service_type_id, v_task.consultant_id, v_old_record.store_id, p_service_description,
    v_old_record.motorcycle_plate, v_old_record.motorcycle_model,
    p_last_service_date, p_last_service_mileage, p_current_mileage, current_date,
    p_next_service_mileage, v_next_date, round(v_daily::numeric, 1)
  ) returning * into v_record;

  insert into tasks(service_record_id, customer_id, consultant_id, store_id, scheduled_date, status, attempt_count)
  values (v_record.id, v_old_record.customer_id, v_task.consultant_id, v_old_record.store_id, subtract_business_days(v_next_date, v_lead), 'pending', 0)
  returning * into v_new_task;

  insert into contact_attempts(task_id, consultant_id, outcome, rescheduled_date, next_task_id, renewal_scenario)
    values (p_task_id, v_uid, 'renewed', v_new_task.scheduled_date, v_new_task.id, p_scenario)
    returning * into v_attempt;
  update tasks set status='completed_rescheduled', completed_at=now(), updated_at=now() where id = p_task_id;

  return json_build_object('service_record', row_to_json(v_record), 'task', row_to_json(v_new_task), 'outcome', 'renewed');
end;
$$;

-- ── Dashboards: filtro opcional por loja ────────────────────
create or replace function public.get_dashboard_metrics(p_from date, p_to date, p_store_id bigint default null)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'prospeccoes_registradas',
      (select count(*) from service_records sr
       where sr.created_at::date between p_from and p_to and (p_store_id is null or sr.store_id = p_store_id)),
    'agendamentos_realizados',
      (select count(*) from contact_attempts ca join tasks t on t.id = ca.task_id
       where ca.outcome='scheduled' and ca.created_at::date between p_from and p_to and (p_store_id is null or t.store_id = p_store_id)),
    'prospeccoes_sem_sucesso',
      (select count(*) from contact_attempts ca join tasks t on t.id = ca.task_id
       where ca.outcome='abandoned' and ca.created_at::date between p_from and p_to and (p_store_id is null or t.store_id = p_store_id))
  );
$$;

create or replace function public.get_dashboard_details(p_metric text, p_from date, p_to date, p_store_id bigint default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_result json;
begin
  if p_metric = 'registradas' then
    select coalesce(json_agg(row_to_json(t)), '[]'::json) into v_result from (
      select sr.id, c.name as customer_name, c.phone as customer_phone,
             sr.motorcycle_model, sr.motorcycle_plate, sr.next_service_date, sr.created_at
      from service_records sr join customers c on c.id = sr.customer_id
      where sr.created_at::date between p_from and p_to and (p_store_id is null or sr.store_id = p_store_id)
      order by sr.created_at desc
    ) t;
  elsif p_metric = 'agendamentos' then
    select coalesce(json_agg(row_to_json(t)), '[]'::json) into v_result from (
      select ca.id, c.name as customer_name, c.phone as customer_phone, ca.appointment_date, ca.created_at
      from contact_attempts ca join tasks tk on tk.id = ca.task_id join customers c on c.id = tk.customer_id
      where ca.outcome='scheduled' and ca.created_at::date between p_from and p_to and (p_store_id is null or tk.store_id = p_store_id)
      order by ca.created_at desc
    ) t;
  elsif p_metric = 'sem_sucesso' then
    select coalesce(json_agg(row_to_json(t)), '[]'::json) into v_result from (
      select ca.id, c.name as customer_name, c.phone as customer_phone, ar.label as reason, ca.created_at
      from contact_attempts ca join tasks tk on tk.id = ca.task_id join customers c on c.id = tk.customer_id
      left join abandonment_reasons ar on ar.id = ca.abandonment_reason_id
      where ca.outcome='abandoned' and ca.created_at::date between p_from and p_to and (p_store_id is null or tk.store_id = p_store_id)
      order by ca.created_at desc
    ) t;
  else v_result := '[]'::json;
  end if;
  return v_result;
end;
$$;

create or replace function public.get_abandonment_breakdown(p_from date, p_to date, p_store_id bigint default null)
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
    select coalesce(ar.label, 'Outros') as label, count(*)::int as count
    from contact_attempts ca join tasks tk on tk.id = ca.task_id
    left join abandonment_reasons ar on ar.id = ca.abandonment_reason_id
    where ca.outcome='abandoned' and ca.created_at::date between p_from and p_to and (p_store_id is null or tk.store_id = p_store_id)
    group by coalesce(ar.label, 'Outros') order by count(*) desc
  ) t;
$$;

create or replace function public.get_renewal_breakdown(p_from date, p_to date, p_store_id bigint default null)
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
    select coalesce(ca.renewal_scenario, 'Não informado') as label, count(*)::int as count
    from contact_attempts ca join tasks tk on tk.id = ca.task_id
    where ca.outcome='renewed' and ca.created_at::date between p_from and p_to and (p_store_id is null or tk.store_id = p_store_id)
    group by coalesce(ca.renewal_scenario, 'Não informado') order by count(*) desc
  ) t;
$$;
