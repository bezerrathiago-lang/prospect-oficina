-- ============================================================
-- ProspectMoto — Ajustes (junho/2026)
-- Taxonomia de motivos, renovação de prospecção (novo ciclo),
-- detalhes do dashboard e breakdown de motivos de insucesso
-- ============================================================

-- ── Ajuste 5: taxonomia de motivos ──────────────────────────
update public.abandonment_reasons
  set label = 'Cliente foi para oficina paralela'
  where label = 'Cliente foi para outra oficina';

update public.abandonment_reasons
  set label = 'Já fez o serviço conosco', is_service_done = false
  where is_service_done = true;

insert into public.abandonment_reasons (label, is_other, is_service_done, sort_order)
select 'Cliente foi para concorrente Honda', false, false,
       coalesce((select max(sort_order) from public.abandonment_reasons), 0) + 1
where not exists (
  select 1 from public.abandonment_reasons where label = 'Cliente foi para concorrente Honda'
);

-- ── Ajuste 6: novo outcome 'renewed' + RPC renew_prospection ──
alter table public.contact_attempts drop constraint if exists contact_attempts_outcome_check;
alter table public.contact_attempts add constraint contact_attempts_outcome_check
  check (outcome in ('scheduled','rescheduled','abandoned','remeasured','renewed'));

create or replace function public.renew_prospection(
  p_task_id bigint,
  p_service_type_id bigint,
  p_service_description text,
  p_last_service_date date,
  p_last_service_mileage int,
  p_current_mileage int,
  p_next_service_mileage int
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_task tasks;
  v_old_record service_records;
  v_lead int;
  v_days_elapsed int;
  v_daily real;
  v_days_until int;
  v_next_date date;
  v_record service_records;
  v_new_task tasks;
  v_attempt contact_attempts;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;

  select * into v_task from tasks where id = p_task_id;
  if v_task.id is null then raise exception 'Tarefa não encontrada.'; end if;
  if v_task.consultant_id <> v_uid then raise exception 'Sem permissão.'; end if;
  if v_task.status <> 'pending' then raise exception 'Esta tarefa já foi encerrada.'; end if;

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

  -- novo ciclo: novo service_record herdando cliente e moto
  insert into service_records(
    customer_id, service_type_id, consultant_id, service_description,
    motorcycle_plate, motorcycle_model,
    last_service_date, last_service_mileage, current_mileage, current_mileage_date,
    next_service_mileage, next_service_date, daily_average_km
  ) values (
    v_old_record.customer_id, p_service_type_id, v_uid, p_service_description,
    v_old_record.motorcycle_plate, v_old_record.motorcycle_model,
    p_last_service_date, p_last_service_mileage, p_current_mileage, current_date,
    p_next_service_mileage, v_next_date, round(v_daily::numeric, 1)
  ) returning * into v_record;

  insert into tasks(service_record_id, customer_id, consultant_id, scheduled_date, status, attempt_count)
  values (v_record.id, v_old_record.customer_id, v_uid, subtract_business_days(v_next_date, v_lead), 'pending', 0)
  returning * into v_new_task;

  -- encerra a prospecção atual e registra a renovação
  insert into contact_attempts(task_id, consultant_id, outcome, rescheduled_date, next_task_id)
    values (p_task_id, v_uid, 'renewed', v_new_task.scheduled_date, v_new_task.id)
    returning * into v_attempt;
  update tasks set status='completed_rescheduled', completed_at=now(), updated_at=now()
    where id = p_task_id;

  return json_build_object(
    'service_record', row_to_json(v_record),
    'task', row_to_json(v_new_task),
    'outcome', 'renewed'
  );
end;
$$;

-- ── Ajuste 3: detalhes do dashboard ─────────────────────────
create or replace function public.get_dashboard_details(p_metric text, p_from date, p_to date)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_result json;
begin
  if p_metric = 'registradas' then
    select coalesce(json_agg(row_to_json(t)), '[]'::json) into v_result from (
      select sr.id,
             c.name as customer_name,
             c.phone as customer_phone,
             sr.motorcycle_model,
             sr.motorcycle_plate,
             sr.next_service_date,
             sr.created_at
      from service_records sr
      join customers c on c.id = sr.customer_id
      where sr.created_at::date between p_from and p_to
      order by sr.created_at desc
    ) t;
  elsif p_metric = 'agendamentos' then
    select coalesce(json_agg(row_to_json(t)), '[]'::json) into v_result from (
      select ca.id,
             c.name as customer_name,
             c.phone as customer_phone,
             ca.appointment_date,
             ca.created_at
      from contact_attempts ca
      join customers c on c.id = (select customer_id from tasks where id = ca.task_id)
      where ca.outcome = 'scheduled' and ca.created_at::date between p_from and p_to
      order by ca.created_at desc
    ) t;
  elsif p_metric = 'sem_sucesso' then
    select coalesce(json_agg(row_to_json(t)), '[]'::json) into v_result from (
      select ca.id,
             c.name as customer_name,
             c.phone as customer_phone,
             ar.label as reason,
             ca.created_at
      from contact_attempts ca
      join customers c on c.id = (select customer_id from tasks where id = ca.task_id)
      left join abandonment_reasons ar on ar.id = ca.abandonment_reason_id
      where ca.outcome = 'abandoned' and ca.created_at::date between p_from and p_to
      order by ca.created_at desc
    ) t;
  else
    v_result := '[]'::json;
  end if;
  return v_result;
end;
$$;

-- ── Ajuste 7: breakdown de motivos de insucesso ─────────────
create or replace function public.get_abandonment_breakdown(p_from date, p_to date)
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
    select coalesce(ar.label, 'Outros') as label, count(*)::int as count
    from contact_attempts ca
    left join abandonment_reasons ar on ar.id = ca.abandonment_reason_id
    where ca.outcome = 'abandoned' and ca.created_at::date between p_from and p_to
    group by coalesce(ar.label, 'Outros')
    order by count(*) desc
  ) t;
$$;
