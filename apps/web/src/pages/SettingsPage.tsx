/**
 * SettingsPage — Configurações
 *
 * Tela 5 do wireframe UX:
 *   - Seção "Tipos de Serviço" com lista de tipos cadastrados
 *   - Botão "+ Adicionar Tipo de Serviço" abre bottom sheet
 *   - Botão "Editar" em cada item abre bottom sheet preenchido
 *   - Seção colapsável "Inativos" para tipos desativados
 *   - Seção "Motivos de Desistência" com lista e gerenciamento (Story 5.2)
 */
import { useState } from 'react';
import { useServiceTypes } from '../hooks/useServiceTypes.js';
import { useAbandonmentReasons } from '../hooks/useAbandonmentReasons.js';
import ServiceTypeItem from '../components/service-types/ServiceTypeItem.js';
import ServiceTypeSheet from '../components/service-types/ServiceTypeSheet.js';
import AbandonmentReasonItem from '../components/abandonment-reasons/AbandonmentReasonItem.js';
import AbandonmentReasonSheet from '../components/abandonment-reasons/AbandonmentReasonSheet.js';
import type { ServiceType } from '../services/serviceTypes.service.js';
import type { AbandonmentReason } from '../services/abandonmentReasons.service.js';

export default function SettingsPage() {
  // ── Tipos de Serviço ─────────────────────────────────────────
  const { data: allServiceTypes, isLoading: stLoading, isError: stError } = useServiceTypes(true);
  const activeTypes = allServiceTypes?.filter((t) => t.is_active) ?? [];
  const inactiveTypes = allServiceTypes?.filter((t) => !t.is_active) ?? [];

  const [stSheetOpen, setStSheetOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [stInactivesExpanded, setStInactivesExpanded] = useState(false);

  function openStCreateSheet() {
    setSelectedServiceType(null);
    setStSheetOpen(true);
  }

  function openStEditSheet(serviceType: ServiceType) {
    setSelectedServiceType(serviceType);
    setStSheetOpen(true);
  }

  function closeStSheet() {
    setStSheetOpen(false);
    setSelectedServiceType(null);
  }

  // ── Motivos de Desistência ────────────────────────────────────
  const { data: allReasons, isLoading: arLoading, isError: arError } = useAbandonmentReasons(true);
  const activeReasons = allReasons?.filter((r) => r.is_active) ?? [];
  const inactiveReasons = allReasons?.filter((r) => !r.is_active) ?? [];

  const [arSheetOpen, setArSheetOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<AbandonmentReason | null>(null);
  const [arInactivesExpanded, setArInactivesExpanded] = useState(false);

  function openArCreateSheet() {
    setSelectedReason(null);
    setArSheetOpen(true);
  }

  function openArEditSheet(reason: AbandonmentReason) {
    setSelectedReason(reason);
    setArSheetOpen(true);
  }

  function closeArSheet() {
    setArSheetOpen(false);
    setSelectedReason(null);
  }

  return (
    <>
      <main className="flex-1 px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>

        {/* ── Seção: Tipos de Serviço ──────────────────────────── */}
        <section className="mt-6" aria-labelledby="service-types-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="service-types-heading"
              className="text-base font-semibold text-gray-800"
            >
              Tipos de Serviço
            </h2>
            <button
              type="button"
              onClick={openStCreateSheet}
              className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
            >
              <span aria-hidden="true">+</span>
              Adicionar
            </button>
          </div>

          <div className="h-px bg-gray-200 mb-4" />

          {/* Loading */}
          {stLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-gray-100"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {stError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Erro ao carregar tipos de serviço. Tente recarregar a página.
            </div>
          )}

          {/* Lista de tipos ativos */}
          {!stLoading && !stError && (
            <>
              {activeTypes.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  Nenhum tipo de serviço cadastrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeTypes.map((serviceType) => (
                    <ServiceTypeItem
                      key={serviceType.id}
                      serviceType={serviceType}
                      onEdit={openStEditSheet}
                    />
                  ))}
                </div>
              )}

              {/* Seção colapsável de inativos */}
              {inactiveTypes.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setStInactivesExpanded((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    aria-expanded={stInactivesExpanded}
                    aria-controls="inactive-service-types"
                  >
                    <span>Inativos ({inactiveTypes.length})</span>
                    <span
                      className={[
                        'transition-transform duration-200',
                        stInactivesExpanded ? 'rotate-90' : '',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      ▶
                    </span>
                  </button>

                  {stInactivesExpanded && (
                    <div id="inactive-service-types" className="mt-3 space-y-3">
                      {inactiveTypes.map((serviceType) => (
                        <ServiceTypeItem
                          key={serviceType.id}
                          serviceType={serviceType}
                          onEdit={openStEditSheet}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Seção: Motivos de Desistência (Story 5.2) ───────── */}
        <section className="mt-8" aria-labelledby="abandonment-reasons-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="abandonment-reasons-heading"
              className="text-base font-semibold text-gray-800"
            >
              Motivos de Desistência
            </h2>
            <button
              type="button"
              onClick={openArCreateSheet}
              className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
            >
              <span aria-hidden="true">+</span>
              Adicionar
            </button>
          </div>

          <div className="h-px bg-gray-200 mb-4" />

          {/* Loading */}
          {arLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-gray-100"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {arError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Erro ao carregar motivos de desistência. Tente recarregar a página.
            </div>
          )}

          {/* Lista de motivos ativos */}
          {!arLoading && !arError && (
            <>
              {activeReasons.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  Nenhum motivo de desistência cadastrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeReasons.map((reason) => (
                    <AbandonmentReasonItem
                      key={reason.id}
                      reason={reason}
                      onEdit={openArEditSheet}
                    />
                  ))}
                </div>
              )}

              {/* Seção colapsável de inativos */}
              {inactiveReasons.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setArInactivesExpanded((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    aria-expanded={arInactivesExpanded}
                    aria-controls="inactive-abandonment-reasons"
                  >
                    <span>
                      Outros — motivos desativados ({inactiveReasons.length})
                    </span>
                    <span
                      className={[
                        'transition-transform duration-200',
                        arInactivesExpanded ? 'rotate-90' : '',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      ▶
                    </span>
                  </button>

                  {arInactivesExpanded && (
                    <div id="inactive-abandonment-reasons" className="mt-3 space-y-3">
                      {inactiveReasons.map((reason) => (
                        <AbandonmentReasonItem
                          key={reason.id}
                          reason={reason}
                          onEdit={openArEditSheet}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Bottom sheet de tipos de serviço */}
      <ServiceTypeSheet
        open={stSheetOpen}
        serviceType={selectedServiceType}
        onClose={closeStSheet}
      />

      {/* Bottom sheet de motivos de desistência */}
      <AbandonmentReasonSheet
        open={arSheetOpen}
        reason={selectedReason}
        onClose={closeArSheet}
      />
    </>
  );
}
