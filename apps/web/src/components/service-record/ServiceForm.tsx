/**
 * ServiceForm — Formulário de registro de atendimento
 *
 * Campos:
 *   - Nome do cliente (texto)
 *   - Telefone (máscara (XX) XXXXX-XXXX, manual via onChange)
 *   - Tipo de Serviço (dropdown com service_types ativos)
 *   - Data do último serviço (datepicker nativo, não permite data futura)
 *   - Km no último serviço (numérico com separador de milhar no display)
 *   - Km atual — hoje (numérico, deve ser > km último serviço)
 *   - Km do próximo serviço (numérico, deve ser > km atual)
 *   - Data de hoje (somente leitura, preenchida automaticamente)
 *
 * Preview em tempo real: ForecastPreviewCard calculado via lib/forecast.ts
 * Validações inline abaixo de cada campo
 * Botão fixo no rodapé, desabilitado enquanto inválido ou enviando
 */
import { useState, useMemo } from 'react';
import { useServiceTypes } from '../../hooks/useServiceTypes.js';
import { useCreateServiceRecord } from '../../hooks/useServiceRecord.js';
import { useStores } from '../../hooks/useStores.js';
import { useAuthStore } from '../../store/authStore.js';
import { calculateForecast } from '../../lib/forecast.js';
import ForecastPreviewCard from './ForecastPreviewCard.js';
import DateField from '../ui/DateField.js';
import type { CreateServiceRecordResponse } from '../../services/serviceRecords.service.js';

// ── Tipos ────────────────────────────────────────────────────────

interface FormState {
  customerName: string;
  customerPhone: string;
  motorcycleModel: string;
  motorcyclePlate: string;
  serviceTypeId: string;
  serviceDescription: string;
  lastServiceDate: string;
  lastServiceMileage: string;
  currentMileage: string;
  nextServiceMileage: string;
}

interface FormErrors {
  customerName?: string;
  customerPhone?: string;
  motorcycleModel?: string;
  motorcyclePlate?: string;
  serviceTypeId?: string;
  serviceDescription?: string;
  lastServiceDate?: string;
  lastServiceMileage?: string;
  currentMileage?: string;
  nextServiceMileage?: string;
}

interface ServiceFormProps {
  onSuccess: (response: CreateServiceRecordResponse) => void;
}

// ── Helpers ──────────────────────────────────────────────────────

/** Formata número com separador de milhar (ex.: 12345 → "12.345") */
function formatMileage(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('pt-BR');
}

/** Remove formatação e retorna apenas dígitos */
function parseMileage(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

/** Aplica máscara de telefone: (XX) XXXXX-XXXX */
function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Data de hoje no formato YYYY-MM-DD */
function todayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formata data ISO para exibição DD/MM/YY */
function formatDateBR(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${(year ?? '').slice(-2)}`;
}

/** Valida o formulário e retorna objeto de erros */
function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  // Nome
  if (!form.customerName.trim()) {
    errors.customerName = 'Nome é obrigatório.';
  } else if (form.customerName.trim().length < 3) {
    errors.customerName = 'Nome deve ter no mínimo 3 caracteres.';
  }

  // Telefone
  if (!form.customerPhone) {
    errors.customerPhone = 'Telefone é obrigatório.';
  } else if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(form.customerPhone)) {
    errors.customerPhone = 'Telefone deve estar no formato (XX) XXXXX-XXXX.';
  }

  // Modelo da moto
  if (!form.motorcycleModel.trim()) {
    errors.motorcycleModel = 'Modelo da moto é obrigatório.';
  } else if (form.motorcycleModel.trim().length < 2) {
    errors.motorcycleModel = 'Modelo muito curto.';
  }

  // Placa da moto (7 caracteres alfanuméricos — Mercosul ou antiga)
  const plateClean = form.motorcyclePlate.replace(/[^A-Za-z0-9]/g, '');
  if (!plateClean) {
    errors.motorcyclePlate = 'Placa é obrigatória.';
  } else if (plateClean.length !== 7) {
    errors.motorcyclePlate = 'Placa deve ter 7 caracteres (ex.: ABC1D23).';
  }

  // Tipo de serviço
  if (!form.serviceTypeId) {
    errors.serviceTypeId = 'Tipo de serviço é obrigatório.';
  }

  // Descrição do serviço
  if (!form.serviceDescription.trim()) {
    errors.serviceDescription = 'Descrição do serviço é obrigatória.';
  } else if (form.serviceDescription.trim().length < 3) {
    errors.serviceDescription = 'Descrição deve ter no mínimo 3 caracteres.';
  }

  // Data do último serviço
  if (!form.lastServiceDate) {
    errors.lastServiceDate = 'Data do último serviço é obrigatória.';
  } else {
    const lastDate = new Date(form.lastServiceDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lastDate >= today) {
      errors.lastServiceDate =
        'Data do último serviço deve ser anterior a hoje (ao menos 1 dia de diferença).';
    }
  }

  // Km no último serviço
  const lastKm = parseInt(parseMileage(form.lastServiceMileage), 10);
  if (!form.lastServiceMileage || isNaN(lastKm)) {
    errors.lastServiceMileage = 'Km no último serviço é obrigatório.';
  } else if (lastKm <= 0) {
    errors.lastServiceMileage = 'Km deve ser um número positivo.';
  }

  // Km atual
  const currentKm = parseInt(parseMileage(form.currentMileage), 10);
  if (!form.currentMileage || isNaN(currentKm)) {
    errors.currentMileage = 'Km atual é obrigatório.';
  } else if (currentKm <= 0) {
    errors.currentMileage = 'Km deve ser um número positivo.';
  } else if (!isNaN(lastKm) && currentKm <= lastKm) {
    errors.currentMileage = 'Km atual deve ser maior que km do último serviço.';
  }

  // Km do próximo serviço
  const nextKm = parseInt(parseMileage(form.nextServiceMileage), 10);
  if (!form.nextServiceMileage || isNaN(nextKm)) {
    errors.nextServiceMileage = 'Km do próximo serviço é obrigatório.';
  } else if (nextKm <= 0) {
    errors.nextServiceMileage = 'Km deve ser um número positivo.';
  } else if (!isNaN(currentKm) && nextKm <= currentKm) {
    errors.nextServiceMileage =
      'Km do próximo serviço deve ser maior que km atual.';
  }

  return errors;
}

// ── Componente ───────────────────────────────────────────────────

export default function ServiceForm({ onSuccess }: ServiceFormProps) {
  const today = todayIso();

  const [form, setForm] = useState<FormState>({
    customerName: '',
    customerPhone: '',
    motorcycleModel: '',
    motorcyclePlate: '',
    serviceTypeId: '',
    serviceDescription: '',
    lastServiceDate: '',
    lastServiceMileage: '',
    currentMileage: '',
    nextServiceMileage: '',
  });

  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Loja: consultor herda a própria (não escolhe). Admin/gerente (sem loja) escolhem.
  const authUser = useAuthStore((s) => s.user);
  const needsStorePick = !authUser?.storeId;
  const { data: stores = [], isLoading: loadingStores } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>('');

  const { data: serviceTypes = [], isLoading: loadingTypes } = useServiceTypes();
  const mutation = useCreateServiceRecord(onSuccess);

  // Erros de validação (só exibe se campo foi tocado ou tentou submeter)
  const errors = useMemo(() => validate(form), [form]);

  const visibleErrors: FormErrors = {};
  (Object.keys(errors) as (keyof FormErrors)[]).forEach((key) => {
    if (submitAttempted || touched[key]) {
      visibleErrors[key] = errors[key] as string;
    }
  });

  const storeMissing = needsStorePick && !selectedStore;
  const isFormValid = Object.keys(errors).length === 0 && !storeMissing;

  // Preview de previsão em tempo real
  const forecast = useMemo(
    () =>
      calculateForecast({
        lastServiceDate: form.lastServiceDate || null,
        lastServiceMileage: form.lastServiceMileage
          ? parseInt(parseMileage(form.lastServiceMileage), 10)
          : null,
        currentMileage: form.currentMileage
          ? parseInt(parseMileage(form.currentMileage), 10)
          : null,
        nextServiceMileage: form.nextServiceMileage
          ? parseInt(parseMileage(form.nextServiceMileage), 10)
          : null,
      }),
    [
      form.lastServiceDate,
      form.lastServiceMileage,
      form.currentMileage,
      form.nextServiceMileage,
    ],
  );

  // ── Handlers ────────────────────────────────────────────────

  function handleBlur(field: keyof FormState) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhoneChange(raw: string) {
    handleChange('customerPhone', applyPhoneMask(raw));
  }

  function handleMileageChange(field: keyof FormState, raw: string) {
    const digits = parseMileage(raw);
    handleChange(field, digits ? formatMileage(digits) : '');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormValid || mutation.isPending) return;

    mutation.mutate({
      customer_name: form.customerName.trim(),
      customer_phone: form.customerPhone,
      motorcycle_model: form.motorcycleModel.trim(),
      motorcycle_plate: form.motorcyclePlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
      service_type_id: parseInt(form.serviceTypeId, 10),
      service_description: form.serviceDescription.trim(),
      last_service_date: form.lastServiceDate,
      last_service_mileage: parseInt(parseMileage(form.lastServiceMileage), 10),
      current_mileage: parseInt(parseMileage(form.currentMileage), 10),
      next_service_mileage: parseInt(parseMileage(form.nextServiceMileage), 10),
      store_id: needsStorePick ? Number(selectedStore) : null,
    });
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24">
      {/* ── Loja (apenas admin/gerente, que não têm loja própria) ─── */}
      {needsStorePick && (
        <div className="mb-4">
          <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-1">
            Loja <span className="text-red-500">*</span>
          </label>
          <select
            id="storeId"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            disabled={loadingStores}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              submitAttempted && storeMissing ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">{loadingStores ? 'Carregando...' : 'Selecione a loja'}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {submitAttempted && storeMissing && (
            <p className="mt-1 text-xs text-red-600">Selecione a loja do atendimento.</p>
          )}
        </div>
      )}

      {/* ── Nome do cliente ─── */}
      <div className="mb-4">
        <label
          htmlFor="customerName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nome do cliente <span className="text-red-500">*</span>
        </label>
        <input
          id="customerName"
          type="text"
          value={form.customerName}
          onChange={(e) => handleChange('customerName', e.target.value)}
          onBlur={() => handleBlur('customerName')}
          placeholder="Nome completo"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            visibleErrors.customerName
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.customerName && (
          <p className="mt-1 text-xs text-red-600">{visibleErrors.customerName}</p>
        )}
      </div>

      {/* ── Telefone ─── */}
      <div className="mb-4">
        <label
          htmlFor="customerPhone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Telefone <span className="text-red-500">*</span>
        </label>
        <input
          id="customerPhone"
          type="tel"
          inputMode="numeric"
          value={form.customerPhone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onBlur={() => handleBlur('customerPhone')}
          placeholder="(XX) XXXXX-XXXX"
          maxLength={16}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            visibleErrors.customerPhone
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.customerPhone && (
          <p className="mt-1 text-xs text-red-600">{visibleErrors.customerPhone}</p>
        )}
      </div>

      {/* ── Modelo da moto ─── */}
      <div className="mb-4">
        <label
          htmlFor="motorcycleModel"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Modelo da moto <span className="text-red-500">*</span>
        </label>
        <input
          id="motorcycleModel"
          type="text"
          value={form.motorcycleModel}
          onChange={(e) => handleChange('motorcycleModel', e.target.value)}
          onBlur={() => handleBlur('motorcycleModel')}
          placeholder="Ex.: Honda CG 160 Titan"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            visibleErrors.motorcycleModel ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.motorcycleModel && (
          <p className="mt-1 text-xs text-red-600">{visibleErrors.motorcycleModel}</p>
        )}
      </div>

      {/* ── Placa da moto ─── */}
      <div className="mb-4">
        <label
          htmlFor="motorcyclePlate"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Placa <span className="text-red-500">*</span>
        </label>
        <input
          id="motorcyclePlate"
          type="text"
          value={form.motorcyclePlate}
          onChange={(e) =>
            handleChange('motorcyclePlate', e.target.value.toUpperCase().slice(0, 8))
          }
          onBlur={() => handleBlur('motorcyclePlate')}
          placeholder="Ex.: ABC1D23"
          className={`w-full rounded-lg border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            visibleErrors.motorcyclePlate ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.motorcyclePlate && (
          <p className="mt-1 text-xs text-red-600">{visibleErrors.motorcyclePlate}</p>
        )}
      </div>

      {/* ── Tipo de Serviço ─── */}
      <div className="mb-4">
        <label
          htmlFor="serviceTypeId"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tipo de Serviço <span className="text-red-500">*</span>
        </label>
        <select
          id="serviceTypeId"
          value={form.serviceTypeId}
          onChange={(e) => handleChange('serviceTypeId', e.target.value)}
          onBlur={() => handleBlur('serviceTypeId')}
          disabled={loadingTypes}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
            visibleErrors.serviceTypeId ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        >
          <option value="">
            {loadingTypes ? 'Carregando...' : 'Selecione o tipo de serviço'}
          </option>
          {serviceTypes.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
        {visibleErrors.serviceTypeId && (
          <p className="mt-1 text-xs text-red-600">{visibleErrors.serviceTypeId}</p>
        )}
      </div>

      {/* ── Descrição do Serviço ─── */}
      <div className="mb-4">
        <label
          htmlFor="serviceDescription"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Descrição do Serviço <span className="text-red-500">*</span>
        </label>
        <textarea
          id="serviceDescription"
          rows={3}
          value={form.serviceDescription}
          onChange={(e) => handleChange('serviceDescription', e.target.value)}
          onBlur={() => handleBlur('serviceDescription')}
          placeholder="Ex.: Troca de óleo e filtro, revisão de freios"
          maxLength={500}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${
            visibleErrors.serviceDescription
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.serviceDescription && (
          <p className="mt-1 text-xs text-red-600">{visibleErrors.serviceDescription}</p>
        )}
      </div>

      {/* ── Data do último serviço ─── */}
      <div className="mb-4">
        <label
          htmlFor="lastServiceDate"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Data do último serviço <span className="text-red-500">*</span>
        </label>
        <DateField
          id="lastServiceDate"
          value={form.lastServiceDate}
          max={today}
          onChange={(v) => handleChange('lastServiceDate', v)}
          onBlur={() => handleBlur('lastServiceDate')}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            visibleErrors.lastServiceDate
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.lastServiceDate && (
          <p className="mt-1 text-xs text-red-600">{visibleErrors.lastServiceDate}</p>
        )}
      </div>

      {/* ── Km no último serviço ─── */}
      <div className="mb-4">
        <label
          htmlFor="lastServiceMileage"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Km no último serviço <span className="text-red-500">*</span>
        </label>
        <input
          id="lastServiceMileage"
          type="text"
          inputMode="numeric"
          value={form.lastServiceMileage}
          onChange={(e) =>
            handleMileageChange('lastServiceMileage', e.target.value)
          }
          onBlur={() => handleBlur('lastServiceMileage')}
          placeholder="Ex.: 12.000"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            visibleErrors.lastServiceMileage
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.lastServiceMileage && (
          <p className="mt-1 text-xs text-red-600">
            {visibleErrors.lastServiceMileage}
          </p>
        )}
      </div>

      {/* ── Km atual ─── */}
      <div className="mb-4">
        <label
          htmlFor="currentMileage"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Km atual — hoje <span className="text-red-500">*</span>
        </label>
        <input
          id="currentMileage"
          type="text"
          inputMode="numeric"
          value={form.currentMileage}
          onChange={(e) => handleMileageChange('currentMileage', e.target.value)}
          onBlur={() => handleBlur('currentMileage')}
          placeholder="Ex.: 15.000"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            visibleErrors.currentMileage
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.currentMileage && (
          <p className="mt-1 text-xs text-red-600">{visibleErrors.currentMileage}</p>
        )}
      </div>

      {/* ── Km do próximo serviço ─── */}
      <div className="mb-4">
        <label
          htmlFor="nextServiceMileage"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Km do próximo serviço <span className="text-red-500">*</span>
        </label>
        <input
          id="nextServiceMileage"
          type="text"
          inputMode="numeric"
          value={form.nextServiceMileage}
          onChange={(e) =>
            handleMileageChange('nextServiceMileage', e.target.value)
          }
          onBlur={() => handleBlur('nextServiceMileage')}
          placeholder="Ex.: 16.000"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            visibleErrors.nextServiceMileage
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {visibleErrors.nextServiceMileage && (
          <p className="mt-1 text-xs text-red-600">
            {visibleErrors.nextServiceMileage}
          </p>
        )}
      </div>

      {/* ── Data de hoje (somente leitura) ─── */}
      <div className="mb-4">
        <label
          htmlFor="todayDate"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Data de hoje
        </label>
        <input
          id="todayDate"
          type="date"
          value={today}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-400">
          Preenchida automaticamente pelo sistema
        </p>
      </div>

      {/* ── Preview de previsão ─── */}
      <ForecastPreviewCard
        dailyAverageKm={forecast ? forecast.dailyAverageKm : null}
        nextServiceDate={forecast ? forecast.nextServiceDate : null}
      />

      {/* ── Erro da mutation ─── */}
      {mutation.isError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">
            Erro ao salvar atendimento. Verifique os dados e tente novamente.
          </p>
        </div>
      )}

      {/* ── Botão fixo no rodapé ─── */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10">
        <button
          type="submit"
          disabled={!isFormValid || mutation.isPending}
          className={`w-full rounded-lg py-3 text-sm font-semibold transition-colors ${
            !isFormValid || mutation.isPending
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {mutation.isPending ? 'Salvando...' : 'Salvar Atendimento'}
        </button>
      </div>
    </form>
  );
}

// Exportar helper para uso no toast da página
export { formatDateBR };
