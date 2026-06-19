/**
 * CustomerHeader — Card de dados do cliente no topo da tela de histórico
 *
 * Exibe: nome, telefone (link tel:), badge de status da prospecção.
 *
 * Badges:
 *   pending             → "Prospecção Ativa" (laranja)
 *   completed_scheduled → "Agendada" (verde)
 *   completed_rescheduled → "Encerrada" (cinza)
 *   abandoned           → "Desistência" (vermelho)
 *   null                → "Sem registros" (cinza)
 */
import type { ProspectionStatus } from '../../services/customers.service.js';

interface CustomerHeaderProps {
  name: string;
  phone: string;
  latestStatus: ProspectionStatus;
}

interface BadgeConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

function getStatusBadge(status: ProspectionStatus): BadgeConfig {
  switch (status) {
    case 'pending':
      return { label: 'Prospecção Ativa', bgColor: '#FED7AA', textColor: '#C2410C' };
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

/** Formata telefone para link tel: — remove não-dígitos e prefixa +55 */
function toTelHref(phone: string): string {
  return `tel:+55${phone.replace(/\D/g, '')}`;
}

export default function CustomerHeader({ name, phone, latestStatus }: CustomerHeaderProps) {
  const badge = getStatusBadge(latestStatus);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Nome + Badge */}
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900 leading-tight">{name}</h2>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
        >
          {badge.label}
        </span>
      </div>

      {/* Telefone clicável */}
      <a
        href={toTelHref(phone)}
        className="mt-2 inline-flex items-center gap-1 text-blue-600 underline text-sm"
        style={{ minHeight: '44px', paddingTop: '10px', paddingBottom: '10px' }}
      >
        <span aria-hidden="true">📞</span>
        {phone}
      </a>
    </div>
  );
}
