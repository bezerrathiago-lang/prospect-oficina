/**
 * CustomerHistoryPage — Histórico de Clientes — Story 5.1
 *
 * Dois modos:
 *   1. Sem customerId (rota /historico): campo de busca + lista de resultados
 *   2. Com customerId (rota /historico/:customerId): exibe perfil completo do cliente
 *
 * Botão "← Voltar" usa navigate(-1) para preservar contexto (selectedDate no uiStore inalterado).
 */
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomer, useCustomerSearch } from '../hooks/useCustomer.js';
import CustomerHeader from '../components/customer/CustomerHeader.js';
import ServiceRecordCard from '../components/customer/ServiceRecordCard.js';
import type { ProspectionStatus } from '../services/customers.service.js';

// ── Badge de status para lista de busca ──────────────────────────

interface StatusBadgeConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

function getStatusBadge(status: ProspectionStatus): StatusBadgeConfig {
  switch (status) {
    case 'pending':
      return { label: 'Prospecção Ativa', bgColor: '#FECACA', textColor: '#B91C1C' };
    case 'completed_scheduled':
      return { label: 'Agendada', bgColor: '#DCFCE7', textColor: '#15803D' };
    case 'completed_rescheduled':
      return { label: 'Encerrada', bgColor: '#F3F4F6', textColor: '#6B7280' };
    case 'abandoned':
      return { label: 'Desistência', bgColor: '#FEE2E2', textColor: '#DC2626' };
    default:
      return { label: 'Sem registros', bgColor: '#F3F4F6', textColor: '#9CA3AF' };
  }
}

// ── Sub-página: Busca de clientes ─────────────────────────────────

function CustomerSearchPage() {
  const [query, setQuery] = useState('');
  const { data: results, isFetching } = useCustomerSearch(query);

  return (
    <main className="flex-1 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">Histórico de Clientes</h1>
      <p className="mt-1 text-sm text-gray-500">
        Busque por nome ou telefone do cliente.
      </p>

      {/* Campo de busca */}
      <div className="mt-4 relative">
        <input
          type="search"
          placeholder="Buscar cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          autoComplete="off"
          aria-label="Buscar cliente por nome ou telefone"
        />
        {isFetching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            Buscando...
          </span>
        )}
      </div>

      {/* Resultados */}
      {query.length >= 2 && results !== undefined && (
        <div className="mt-4 space-y-2">
          {results.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Nenhum cliente encontrado para "{query}".
            </p>
          ) : (
            results.map((customer) => {
              const badge = getStatusBadge(customer.latest_status);
              return (
                <Link
                  key={customer.id}
                  to={`/historico/${customer.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                  <span
                    className="ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
                  >
                    {badge.label}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Dica quando busca curta */}
      {query.length > 0 && query.length < 2 && (
        <p className="mt-4 text-sm text-gray-400 text-center">
          Digite pelo menos 2 caracteres para buscar.
        </p>
      )}
    </main>
  );
}

// ── Sub-página: Detalhe do cliente ────────────────────────────────

function CustomerDetailPage({ customerId }: { customerId: number }) {
  const navigate = useNavigate();
  const { data: customer, isLoading, isError, error } = useCustomer(customerId);

  // ── Skeleton ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex-1 px-4 py-6">
        <button
          type="button"
          onClick={() => void navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Voltar
        </button>
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-xl bg-gray-100" />
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="h-16 rounded-xl bg-gray-100" />
        </div>
      </main>
    );
  }

  // ── Erro ─────────────────────────────────────────────────────
  if (isError) {
    const axiosError = error as { response?: { status?: number } };
    const is404 = axiosError?.response?.status === 404;

    return (
      <main className="flex-1 px-4 py-6">
        <button
          type="button"
          onClick={() => void navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Voltar
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700 font-medium">
            {is404
              ? 'Cliente não encontrado.'
              : 'Erro ao carregar histórico. Tente novamente.'}
          </p>
        </div>
      </main>
    );
  }

  if (!customer) return null;

  return (
    <main className="flex-1 px-4 py-6">
      {/* Botão Voltar */}
      <button
        type="button"
        onClick={() => void navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Voltar"
      >
        ← Voltar
      </button>

      {/* Card do cliente */}
      <CustomerHeader
        name={customer.name}
        phone={customer.phone}
        latestStatus={customer.latest_status}
      />

      {/* Histórico de atendimentos */}
      <section className="mt-5">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Histórico de Atendimentos
        </h3>

        {customer.service_records.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Nenhum atendimento registrado para este cliente.
          </p>
        ) : (
          <div className="space-y-3">
            {customer.service_records.map((record, index) => (
              <ServiceRecordCard
                key={record.id}
                record={record}
                defaultExpanded={index === 0}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// ── Componente raiz ───────────────────────────────────────────────

export default function CustomerHistoryPage() {
  const { customerId } = useParams<{ customerId?: string }>();
  const parsedId = customerId ? parseInt(customerId, 10) : NaN;

  if (!isNaN(parsedId) && parsedId > 0) {
    return <CustomerDetailPage customerId={parsedId} />;
  }

  return <CustomerSearchPage />;
}
