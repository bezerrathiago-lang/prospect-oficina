/**
 * RenewProspectionForm — programar nova prospecção (próximo ciclo)
 *
 * Reusa a lógica de cálculo por km (lib/forecast) e ForecastPreviewCard.
 * Cliente e moto são herdados da prospecção atual (não pedidos aqui).
 */
import { useState, useMemo } from 'react';
import { useServiceTypes } from '../../hooks/useServiceTypes.js';
import { calculateForecast } from '../../lib/forecast.js';
import ForecastPreviewCard from '../service-record/ForecastPreviewCard.js';
import DateField from '../ui/DateField.js';

interface RenewProspectionFormProps {
  onBack: () => void;
  onConfirm: (data: {
    scenario: string;
    service_type_id: number;
    service_description: string;
    last_service_date: string;
    last_service_mileage: number;
    current_mileage: number;
    next_service_mileage: number;
  }) => void;
  isPending: boolean;
}

/** Cenários que justificam programar uma nova prospecção */
const SCENARIOS = [
  'Já fez o serviço conosco',
  'Fez serviço em oficina paralela',
  'Fez em concorrente Honda',
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMileage(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits ? parseInt(digits, 10).toLocaleString('pt-BR') : '';
}
function parseMileage(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

export default function RenewProspectionForm({
  onBack,
  onConfirm,
  isPending,
}: RenewProspectionFormProps) {
  const today = todayIso();
  const { data: serviceTypes = [], isLoading: loadingTypes } = useServiceTypes();

  const [scenario, setScenario] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [lastDate, setLastDate] = useState('');
  const [lastKm, setLastKm] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [nextKm, setNextKm] = useState('');

  const lastKmNum = lastKm ? parseInt(parseMileage(lastKm), 10) : null;
  const currentKmNum = currentKm ? parseInt(parseMileage(currentKm), 10) : null;
  const nextKmNum = nextKm ? parseInt(parseMileage(nextKm), 10) : null;

  const forecast = useMemo(
    () =>
      calculateForecast({
        lastServiceDate: lastDate || null,
        lastServiceMileage: lastKmNum,
        currentMileage: currentKmNum,
        nextServiceMileage: nextKmNum,
      }),
    [lastDate, lastKmNum, currentKmNum, nextKmNum],
  );

  const valid =
    scenario !== '' &&
    serviceTypeId !== '' &&
    description.trim().length >= 3 &&
    lastDate !== '' &&
    lastDate < today &&
    lastKmNum !== null &&
    currentKmNum !== null &&
    nextKmNum !== null &&
    currentKmNum > lastKmNum &&
    nextKmNum > currentKmNum;

  const canConfirm = valid && !isPending;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm({
      scenario,
      service_type_id: parseInt(serviceTypeId, 10),
      service_description: description.trim(),
      last_service_date: lastDate,
      last_service_mileage: lastKmNum as number,
      current_mileage: currentKmNum as number,
      next_service_mileage: nextKmNum as number,
    });
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        Programe a próxima prospecção informando a quilometragem. A prospecção atual
        será encerrada e uma nova será criada com a data calculada.
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Por que programar nova prospecção? <span className="text-red-500">*</span>
        </label>
        {SCENARIOS.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-3 w-full cursor-pointer rounded-lg border px-4"
            style={{
              minHeight: '44px',
              borderColor: scenario === opt ? '#16A34A' : '#D1D5DB',
              backgroundColor: scenario === opt ? '#F0FDF4' : '#FFFFFF',
            }}
          >
            <input
              type="radio"
              name="renewal_scenario"
              value={opt}
              checked={scenario === opt}
              onChange={() => setScenario(opt)}
              className="accent-green-600 w-4 h-4 shrink-0"
            />
            <span className="text-sm text-gray-800">{opt}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Serviço <span className="text-red-500">*</span>
        </label>
        <select
          value={serviceTypeId}
          onChange={(e) => setServiceTypeId(e.target.value)}
          disabled={loadingTypes}
          className={inputCls}
        >
          <option value="">{loadingTypes ? 'Carregando...' : 'Selecione'}</option>
          {serviceTypes.map((st) => (
            <option key={st.id} value={st.id}>{st.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição do Serviço <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Próxima revisão / troca de óleo"
          className={inputCls + ' resize-y'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data do último serviço <span className="text-red-500">*</span>
        </label>
        <DateField
          value={lastDate}
          max={today}
          onChange={(v) => setLastDate(v)}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Km no último serviço <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={lastKm}
            onChange={(e) => setLastKm(formatMileage(e.target.value))}
            placeholder="Ex.: 12.000"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Km atual — hoje <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={currentKm}
            onChange={(e) => setCurrentKm(formatMileage(e.target.value))}
            placeholder="Ex.: 15.000"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Km do próximo serviço <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={nextKm}
            onChange={(e) => setNextKm(formatMileage(e.target.value))}
            placeholder="Ex.: 18.000"
            className={inputCls}
          />
        </div>
      </div>

      <ForecastPreviewCard
        dailyAverageKm={forecast ? forecast.dailyAverageKm : null}
        nextServiceDate={forecast ? forecast.nextServiceDate : null}
      />

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
          style={{ backgroundColor: canConfirm ? '#16A34A' : undefined }}
        >
          {isPending ? 'Programando...' : 'Programar nova prospecção'}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
