-- ============================================================
-- ProspectMoto — Agenda compartilhada por loja
-- Permite que qualquer usuário da MESMA loja (ou admin/gerente) registre
-- o resultado / renove uma prospecção, não só o consultor que cadastrou.
-- Recria register_contact_attempt e renew_prospection alterando apenas a
-- verificação de permissão.
-- ============================================================

-- ── register_contact_attempt ────────────────────────────────
create or replace function public.register_contact_attempt(
  p_task_id bigint,
  p_outcome text,
  p_appointment_date date default null,
  p_rescheduled_date date default null,
  p_new_mileage int default null,
  p_abandonment_reason_id bigint default null,
  p_abandonment_notes text default null,
  p_service_done_location text default null
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
  v_is_other boolean; v_is_service_done boolean;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  select * into v_task from tasks where id = p_task_id;
  if v_task.id is null then raise exception 'Tarefa não encontrada.'; end if;
  if v_task.consultant_id <> v_uid
     and not is_admin() and not is_manager()
     and v_task.store_id is distinct from current_store_id() then
    raise exception 'Sem permissão.'; end if;
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
    insert into tasks(service_record_id, customer_id, consultant_id, store_id, scheduled_date, status, attempt_count)
      values (v_task.service_record_id, v_task.customer_id, v_task.consultant_id, v_task.store_id, p_rescheduled_date, 'pending', v_task.attempt_count+1)
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
    insert into tasks(service_record_id, customer_id, consultant_id, store_id, scheduled_date, status, attempt_count)
      values (v_task.service_record_id, v_task.customer_id, v_task.consultant_id, v_task.store_id, v_sched, 'pending', v_task.attempt_count+1)
      returning * into v_new_task;
    update contact_attempts set next_task_id=v_new_task.id where id=v_attempt.id;
    return json_build_object('id', v_attempt.id, 'task_id', p_task_id, 'outcome', 'remeasured', 'next_task_id', v_new_task.id);

  elsif p_outcome = 'abandoned' then
    if p_abandonment_reason_id is null then raise exception 'Motivo de desistência é obrigatório.'; end if;
    select is_other, is_service_done into v_is_other, v_is_service_done
      from abandonment_reasons where id = p_abandonment_reason_id;
    if v_is_other is null then raise exception 'Motivo de desistência não encontrado.'; end if;
    if v_is_other and (p_abandonment_notes is null or length(trim(p_abandonment_notes)) < 5) then
      raise exception 'Descreva o motivo (mínimo 5 caracteres).'; end if;
    if v_is_service_done and (p_service_done_location is null or length(trim(p_service_done_location)) = 0) then
      raise exception 'Informe onde o cliente fez o serviço.'; end if;
    insert into contact_attempts(task_id, consultant_id, outcome, abandonment_reason_id, abandonment_notes, service_done_location)
      values (p_task_id, v_uid, 'abandoned', p_abandonment_reason_id, p_abandonment_notes, p_service_done_location)
      returning * into v_attempt;
    update tasks set status='abandoned', attempt_count=attempt_count+1,
      completed_at=now(), updated_at=now() where id=p_task_id;
    return json_build_object('id', v_attempt.id, 'task_id', p_task_id, 'outcome', 'abandoned');

  else
    raise exception 'Resultado inválido.';
  end if;
end;
$$;

-- ── renew_prospection ───────────────────────────────────────
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
  if v_task.consultant_id <> v_uid
     and not is_admin() and not is_manager()
     and v_task.store_id is distinct from current_store_id() then
    raise exception 'Sem permissão.'; end if;
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
  update tasks set status='completed_rescheduled', completed_at=now(), updated_at=now()
    where id = p_task_id;

  return json_build_object(
    'service_record', row_to_json(v_record),
    'task', row_to_json(v_new_task),
    'outcome', 'renewed'
  );
end;
$$;
