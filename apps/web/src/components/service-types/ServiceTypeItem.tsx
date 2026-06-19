/**
 * ServiceTypeItem — Card de item da lista de tipos de serviço
 *
 * Exibe: nome, antecedência em dias, badge Ativo/Inativo, botão Editar.
 * Design tokens: laranja para ação primária, verde para badge Ativo, cinza para Inativo.
 */
import type { ServiceType } from '../../services/serviceTypes.service.js';

interface ServiceTypeItemProps {
  serviceType: ServiceType;
  onEdit: (serviceType: ServiceType) => void;
}

export default function ServiceTypeItem({ serviceType, onEdit }: ServiceTypeItemProps) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{serviceType.name}</p>
        <p className="mt-0.5 text-sm text-gray-500">
          {serviceType.contact_lead_days} dias de antecedência
        </p>
        <div className="mt-2">
          {serviceType.is_active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              Inativo
            </span>
          )}
        </div>
      </div>

      {/* Botão Editar */}
      <button
        type="button"
        onClick={() => onEdit(serviceType)}
        className="ml-3 shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
        aria-label={`Editar ${serviceType.name}`}
      >
        Editar
      </button>
    </div>
  );
}
