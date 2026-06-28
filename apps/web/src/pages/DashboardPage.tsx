/**
 * DashboardPage — Home: gestão à vista das métricas de prospecção
 *
 * Métricas: prospecções registradas, agendamentos realizados,
 * prospecções sem sucesso e taxa de agendamento. Filtro: hoje / mês / tudo.
 * Cards de contagem são clicáveis (drill-down via modal).
 * Gráfico de motivos de insucesso abaixo dos cards.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardMetrics,
  getAbandonmentBreakdown,
  getRenewalBreakdown,
  type DetailMetric,
} from '../services/dashboard.service.js';
import DashboardDetailModal from '../components/dashboard/DashboardDetailModal.js';
import PieChart from '../components/dashboard/PieChart.js';

type Period = 'hoje' | 'mes' | 'tudo';

function periodRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const iso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  if (period === 'hoje') return { from: iso(now), to: iso(now) };
  if (period === 'mes') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: iso(first), to: iso(last) };
  }
  return { from: '2000-01-01', to: '2999-12-31' };
}

function MetricCard({
  label,
  value,
  accent,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  accent: string;
  hint?: string;
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-left transition-colors ${
        clickable ? 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer' : 'cursor-default'
      }`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold" style={{ color: accent }}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {clickable && <p className="mt-2 text-xs font-medium text-brand-red">Ver detalhes ›</p>}
    </button>
  );
}

const PERIOD_LABELS: Record<Period, string> = {
  hoje: 'Hoje',
  mes: 'Mês atual',
  tudo: 'Tudo',
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('mes');
  const range = useMemo(() => periodRange(period), [period]);
  const [detail, setDetail] = useState<{ metric: DetailMetric; title: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', range.from, range.to],
    queryFn: () => getDashboardMetrics(range.from, range.to),
    staleTime: 30 * 1000,
  });

  const { data: breakdown } = useQuery({
    queryKey: ['dashboard-breakdown', range.from, range.to],
    queryFn: () => getAbandonmentBreakdown(range.from, range.to),
    staleTime: 30 * 1000,
  });

  const { data: renewalBreakdown } = useQuery({
    queryKey: ['dashboard-renewal', range.from, range.to],
    queryFn: () => getRenewalBreakdown(range.from, range.to),
    staleTime: 30 * 1000,
  });

  const registradas = data?.prospeccoes_registradas ?? 0;
  const agendamentos = data?.agendamentos_realizados ?? 0;
  const semSucesso = data?.prospeccoes_sem_sucesso ?? 0;
  const taxa = registradas > 0 ? Math.round((agendamentos / registradas) * 100) : 0;

  const maxCount = Math.max(1, ...(breakdown ?? []).map((b) => b.count));

  return (
    <main className="flex-1 px-4 py-6 md:px-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Gestão à vista</h1>
      <p className="text-sm text-gray-500 mb-4">Visão geral da prospecção</p>

      {/* Filtro de período */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 mb-6">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              period === p ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {isError ? (
        <p className="text-sm text-red-600">Erro ao carregar as métricas. Tente novamente.</p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          <MetricCard
            label="Prospecções registradas"
            value={String(registradas)}
            accent="#4B4F54"
            hint="Atendimentos com previsão criada"
            onClick={() => setDetail({ metric: 'registradas', title: 'Prospecções registradas' })}
          />
          <MetricCard
            label="Agendamentos realizados"
            value={String(agendamentos)}
            accent="#16A34A"
            hint="Contatos que resultaram em agendamento"
            onClick={() => setDetail({ metric: 'agendamentos', title: 'Agendamentos realizados' })}
          />
          <MetricCard
            label="Prospecções sem sucesso"
            value={String(semSucesso)}
            accent="#E1251B"
            hint="Encerradas sem agendamento"
            onClick={() => setDetail({ metric: 'sem_sucesso', title: 'Prospecções sem sucesso' })}
          />
          <MetricCard
            label="Taxa de agendamento"
            value={`${taxa}%`}
            accent="#E1251B"
            hint="Agendamentos ÷ prospecções registradas"
          />
        </div>
      )}

      {/* Gráfico pizza: cenários de nova prospecção */}
      <section className="mt-8 max-w-3xl">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Cenários de nova prospecção
        </h2>
        {!renewalBreakdown || renewalBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma nova prospecção programada no período.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <PieChart data={renewalBreakdown} />
          </div>
        )}
      </section>

      {/* Gráfico de motivos de insucesso */}
      <section className="mt-8 max-w-3xl">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Motivos de abandono</h2>
        {!breakdown || breakdown.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma prospecção sem sucesso no período.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            {breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="truncate pr-2">{b.label}</span>
                  <span className="font-semibold shrink-0">{b.count}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(b.count / maxCount) * 100}%`,
                      backgroundColor: '#E1251B',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de drill-down */}
      {detail && (
        <DashboardDetailModal
          metric={detail.metric}
          title={detail.title}
          from={range.from}
          to={range.to}
          onClose={() => setDetail(null)}
        />
      )}
    </main>
  );
}
