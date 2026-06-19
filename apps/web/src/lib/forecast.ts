/**
 * Cálculo de previsão do próximo serviço — versão client-side
 *
 * Replica a lógica do servidor exclusivamente para exibição de preview em
 * tempo real no formulário. O valor autoritativo é sempre o retornado pela API.
 *
 * Diferença do backend: retorna null em vez de lançar erro quando os dados
 * estiverem incompletos ou inválidos.
 */

// ── Types ────────────────────────────────────────────────────────

export interface ForecastInput {
  lastServiceDate: string | null;   // YYYY-MM-DD
  lastServiceMileage: number | null;
  currentMileage: number | null;
  nextServiceMileage: number | null;
}

export interface ForecastResult {
  dailyAverageKm: number;
  daysUntilNext: number;
  nextServiceDate: Date;
}

// ── Função principal ─────────────────────────────────────────────

/**
 * Calcula previsão do próximo serviço.
 * Retorna null se qualquer campo estiver ausente ou inválido — sem lançar erro.
 */
export function calculateForecast(input: ForecastInput): ForecastResult | null {
  const { lastServiceDate, lastServiceMileage, currentMileage, nextServiceMileage } = input;

  // Validação de presença
  if (
    !lastServiceDate ||
    lastServiceMileage === null ||
    currentMileage === null ||
    nextServiceMileage === null
  ) {
    return null;
  }

  // Validação de valores
  if (
    currentMileage <= lastServiceMileage ||
    nextServiceMileage <= currentMileage
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(lastServiceDate + 'T00:00:00');
  lastDate.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysElapsed = Math.floor((today.getTime() - lastDate.getTime()) / msPerDay);

  if (daysElapsed <= 0) {
    return null;
  }

  const rawDailyAverage = (currentMileage - lastServiceMileage) / daysElapsed;
  const dailyAverageKm = Math.round(rawDailyAverage * 10) / 10;

  const kmRemaining = nextServiceMileage - currentMileage;
  const daysUntilNext = Math.ceil(kmRemaining / rawDailyAverage);

  const nextServiceDate = new Date(today);
  nextServiceDate.setDate(nextServiceDate.getDate() + daysUntilNext);

  return { dailyAverageKm, daysUntilNext, nextServiceDate };
}
