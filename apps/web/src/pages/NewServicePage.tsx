/**
 * NewServicePage — Novo Atendimento
 *
 * Página que exibe o formulário de registro de atendimento (Story 2.2).
 * Após sucesso: exibe toast verde e redireciona para /tarefas.
 *
 * Toast: estado local com auto-dismiss em 4s (sem biblioteca externa).
 */
import { useState, useEffect } from 'react';
import ServiceForm, { formatDateBR } from '../components/service-record/ServiceForm.js';
import type { CreateServiceRecordResponse } from '../services/serviceRecords.service.js';

export default function NewServicePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss do toast após 4 segundos
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  function handleSuccess(response: CreateServiceRecordResponse) {
    const scheduledDateIso = response.task.scheduled_date.slice(0, 10);
    const scheduledDateBR = formatDateBR(scheduledDateIso);
    setToastMessage(`Atendimento salvo! Prospecção agendada para ${scheduledDateBR}`);
    // A navegação para /tarefas é feita pelo hook useCreateServiceRecord
  }

  return (
    <main className="flex-1 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Novo Atendimento</h1>

      {/* Toast de sucesso */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-4 right-4 z-50 rounded-lg bg-green-500 text-white px-4 py-3 text-sm font-medium shadow-lg transition-all"
        >
          {toastMessage}
        </div>
      )}

      <ServiceForm onSuccess={handleSuccess} />
    </main>
  );
}
