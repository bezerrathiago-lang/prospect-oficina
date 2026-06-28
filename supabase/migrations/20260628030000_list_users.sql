-- ============================================================
-- ProspectMoto — RPC list_users (admin)
-- Lista usuários (profiles + email do auth.users + nome da loja).
-- Somente admin pode chamar.
-- ============================================================

create or replace function public.list_users()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Apenas administradores podem listar usuários.';
  end if;

  return coalesce(
    (
      select json_agg(row_to_json(t) order by t.name)
      from (
        select
          p.id,
          p.name,
          u.email,
          p.role,
          p.store_id,
          s.name as store_name
        from public.profiles p
        join auth.users u on u.id = p.id
        left join public.stores s on s.id = p.store_id
        order by p.name
      ) t
    ),
    '[]'::json
  );
end;
$$;

grant execute on function public.list_users() to authenticated;
