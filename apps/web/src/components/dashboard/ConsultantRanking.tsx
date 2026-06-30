/**
 * ConsultantRanking — ranking de consultores no dashboard.
 *
 * Mostra, por consultor, a quantidade de prospecções registradas e de
 * agendamentos no período, em barras horizontais comparativas (CSS puro).
 * Ordenado por prospecções (desc) — o backend já devolve ordenado.
 */
import type { ConsultantRankingItem } from '../../services/dashboard.service.js';

const PROSPECT_COLOR = '#4B4F54'; // grafite
const SCHEDULE_COLOR = '#16A34A'; // verde

export default function ConsultantRanking({ data }: { data: ConsultantRankingItem[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.prospeccoes, d.agendamentos)));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Legenda */}
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: PROSPECT_COLOR }} />
          Prospecções
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: SCHEDULE_COLOR }} />
          Agendamentos
        </span>
      </div>

      <div className="space-y-4">
        {data.map((c, i) => (
          <div key={c.consultant_id}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="truncate pr-2 font-medium text-gray-800">
                <span className="mr-1.5 text-gray-400">{i + 1}.</span>
                {c.name}
              </span>
              <span className="shrink-0 text-xs text-gray-500">
                {c.prospeccoes} prosp. · {c.agendamentos} agend.
              </span>
            </div>

            {/* Barra de prospecções */}
            <div className="mb-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(c.prospeccoes / max) * 100}%`,
                  backgroundColor: PROSPECT_COLOR,
                }}
              />
            </div>
            {/* Barra de agendamentos */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(c.agendamentos / max) * 100}%`,
                  backgroundColor: SCHEDULE_COLOR,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
