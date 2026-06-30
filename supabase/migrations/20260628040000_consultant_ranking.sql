-- ============================================================
-- ProspectMoto — RPC get_consultant_ranking
-- Ranking por consultor: prospecções registradas e agendamentos
-- no período. Somente admin/gerente (tela Início). Filtro opcional por loja.
-- ============================================================

create or replace function public.get_consultant_ranking(
  p_from date,
  p_to date,
  p_store_id bigint default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (is_admin() or is_manager()) then
    raise exception 'Apenas administradores e gerentes podem ver o ranking.';
  end if;

  return coalesce(
    (
      select json_agg(row_to_json(t))
      from (
        select
          p.id as consultant_id,
          p.name,
          coalesce(pr.cnt, 0) as prospeccoes,
          coalesce(ag.cnt, 0) as agendamentos
        from public.profiles p
        -- prospecções registradas (service_records) por consultor no período
        left join (
          select sr.consultant_id, count(*) as cnt
          from public.service_records sr
          where sr.created_at::date between p_from and p_to
            and (p_store_id is null or sr.store_id = p_store_id)
          group by sr.consultant_id
        ) pr on pr.consultant_id = p.id
        -- agendamentos (contact_attempts outcome scheduled) por consultor no período
        left join (
          select ca.consultant_id, count(*) as cnt
          from public.contact_attempts ca
          join public.tasks tk on tk.id = ca.task_id
          where ca.outcome = 'scheduled'
            and ca.created_at::date between p_from and p_to
            and (p_store_id is null or tk.store_id = p_store_id)
          group by ca.consultant_id
        ) ag on ag.consultant_id = p.id
        where coalesce(pr.cnt, 0) > 0 or coalesce(ag.cnt, 0) > 0
        order by coalesce(pr.cnt, 0) desc, coalesce(ag.cnt, 0) desc, p.name
      ) t
    ),
    '[]'::json
  );
end;
$$;

grant execute on function public.get_consultant_ranking(date, date, bigint) to authenticated;
