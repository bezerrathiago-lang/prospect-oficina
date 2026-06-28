/**
 * DashboardDetailModal — lista detalhada de um indicador do dashboard (drill-down)
 */
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardDetails,
  type DetailMetric,
  type DashboardDetailItem,
} from '../../services/dashboard.service.js';

interface Props {
  metric: DetailMetric;
  title: string;
  from: string;
  to: string;
  onClose: () => void;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function ItemRow({ metric, item }: { metric: DetailMetric; item: DashboardDetailItem }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="font-medium text-gray-900 text-sm">{item.customer_name}</p>
      <p className="text-xs text-gray-500">{item.customer_phone}</p>
      {metric === 'registradas' && (
        <p className="text-xs text-gray-600 mt-0.5">
          {item.motorcycle_model} {item.motorcycle_plate ? `· ${item.motorcycle_plate}` : ''}
          {item.next_service_date ? ` · próx. ${formatDate(item.next_service_date)}` : ''}
        </p>
      )}
      {metric === 'agendamentos' && item.appointment_date && (
        <p className="text-xs text-green-700 mt-0.5">Agendado para {formatDate(item.appointment_date)}</p>
      )}
      {metric === 'sem_sucesso' && item.reason && (
        <p className="text-xs text-red-600 mt-0.5">{item.reason}</p>
      )}
    </div>
  );
}

export default function DashboardDetailModal({ metric, title, from, to, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-details', metric, from, to],
    queryFn: () => getDashboardDetails(metric, from, to),
    staleTime: 30 * 1000,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-2">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-gray-500">Carregando...</p>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-red-600">Erro ao carregar.</p>
          ) : !data || data.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Nenhum registro no período.</p>
          ) : (
            data.map((item) => <ItemRow key={item.id} metric={metric} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}
