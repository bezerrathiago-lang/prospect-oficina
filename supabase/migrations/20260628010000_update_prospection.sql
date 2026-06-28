-- ============================================================
-- ProspectMoto — Reorganização do "Atualizar Prospecção"
-- 2 opções: Programar nova prospecção (com cenário) | Abandonar oportunidade
-- + gráfico pizza dos cenários de nova prospecção
-- ============================================================

-- ── Motivos de abandono: nova lista ─────────────────────────
-- Desativar os que viraram cenários de renovação ou saíram da lista
update public.abandonment_reasons set is_active = false
  where label in (
    'Cliente sem interesse',
    'Cliente foi para oficina paralela',
    'Já fez o serviço conosco',
    'Cliente foi para concorrente Honda'
  );

-- Reordenar os mantidos
update public.abandonment_reasons set sort_order = 1 where label = 'Telefone inválido ou não atende';
update public.abandonment_reasons set sort_order = 2 where label = 'Muitas tentativas sem retorno';
update public.abandonment_reasons set sort_order = 3 where label = 'Cliente solicitou não ser contatado';
update public.abandonment_reasons set sort_order = 6 where label = 'Outros';

-- Novos motivos de abandono
insert into public.abandonment_reasons (label, is_other, is_service_done, is_active, sort_order)
select 'Vendeu a moto', false, false, true, 4
where not exists (select 1 from public.abandonment_reasons where label = 'Vendeu a moto');

insert into public.abandonment_reasons (label, is_other, is_service_done, is_active, sort_order)
select 'Não quer mais fazer serviço na concessionária', false, false, true, 5
where not exists (select 1 from public.abandonment_reasons where label = 'Não quer mais fazer serviço na concessionária');

-- ── Cenário da renovação ────────────────────────────────────
alter table public.contact_attempts add column if not exists renewal_scenario text;

-- ── renew_prospection: agora recebe o cenário ───────────────
drop function if exists public.renew_prospection(bigint, bigint, text, date, int, int, int);

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

  if coalesce(trim(p_scenario), '') = '' then
    raise exception 'Informe o cenário da nova prospecção.'; end if;

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

  insert into contact_attempts(task_id, consultant_id, outcome, rescheduled_date, next_task_id, renewal_scenario)
    values (p_task_id, v_uid, 'renewed', v_new_task.scheduled_date, v_new_task.id, p_scenario)
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

-- ── Breakdown dos cenários de nova prospecção (gráfico pizza) ──
create or replace function public.get_renewal_breakdown(p_from date, p_to date)
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
    select coalesce(renewal_scenario, 'Não informado') as label, count(*)::int as count
    from contact_attempts
    where outcome = 'renewed' and created_at::date between p_from and p_to
    group by coalesce(renewal_scenario, 'Não informado')
    order by count(*) desc
  ) t;
$$;
