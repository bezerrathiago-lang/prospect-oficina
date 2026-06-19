/**
 * Cálculo de previsão do próximo serviço
 *
 * Lógica autoritativa do servidor — calcula a data prevista do próximo serviço
 * com base na quilometragem acumulada e na média diária de uso da moto.
 */

// ── Interfaces ───────────────────────────────────────────────────

export interface ForecastInput {
  /** Data do último serviço realizado */
  lastServiceDate: Date;
  /** Quilometragem registrada no último serviço */
  lastServiceMileage: number;
  /** Quilometragem atual (hoje) */
  currentMileage: number;
  /** Quilometragem alvo do próximo serviço */
  nextServiceMileage: number;
  /** Data de hoje (injetada para testabilidade) */
  today: Date;
}

export interface ForecastResult {
  /** Média diária de km, arredondada para 1 casa decimal */
  dailyAverageKm: number;
  /** Dias até o próximo serviço, arredondado para cima */
  daysUntilNext: number;
  /** Data prevista do próximo serviço */
  nextServiceDate: Date;
}

// ── Função principal ─────────────────────────────────────────────

/**
 * Calcula a data prevista do próximo serviço com base no uso real da moto.
 *
 * @throws Error se a data do último serviço não for anterior a hoje
 */
export function calculateNextServiceDate(input: ForecastInput): ForecastResult {
  const { lastServiceDate, lastServiceMileage, currentMileage, nextServiceMileage, today } = input;

  // 1. Dias decorridos (inteiros) entre hoje e o último serviço
  const msPerDay = 1000 * 60 * 60 * 24;
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const lastMidnight = new Date(lastServiceDate);
  lastMidnight.setHours(0, 0, 0, 0);

  const daysElapsed = Math.floor(
    (todayMidnight.getTime() - lastMidnight.getTime()) / msPerDay,
  );

  if (daysElapsed <= 0) {
    throw new Error('Data do último serviço deve ser anterior a hoje');
  }

  // 2. Média diária de km (1 casa decimal)
  const rawDailyAverage = (currentMileage - lastServiceMileage) / daysElapsed;
  const dailyAverageKm = Math.round(rawDailyAverage * 10) / 10;

  // 3. Km restantes até o próximo serviço
  const kmRemaining = nextServiceMileage - currentMileage;

  // 4. Dias até o próximo serviço (arredondado para cima)
  const daysUntilNext = Math.ceil(kmRemaining / rawDailyAverage);

  // 5. Data prevista = hoje + daysUntilNext dias
  const nextServiceDate = new Date(todayMidnight);
  nextServiceDate.setDate(nextServiceDate.getDate() + daysUntilNext);

  return { dailyAverageKm, daysUntilNext, nextServiceDate };
}
