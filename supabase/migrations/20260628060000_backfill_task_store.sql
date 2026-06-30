-- ============================================================
-- ProspectMoto — Backfill de store_id em tasks órfãs
-- Tarefas criadas por reagendar/remedir entre o deploy multi-loja e a
-- correção podem ter ficado com store_id nulo. Herdam do service_record.
-- ============================================================

update public.tasks t
set store_id = sr.store_id
from public.service_records sr
where t.service_record_id = sr.id
  and t.store_id is null
  and sr.store_id is not null;
