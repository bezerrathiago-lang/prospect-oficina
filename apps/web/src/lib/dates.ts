/**
 * Helpers de data — sem bibliotecas externas
 *
 * Todos os formatos de entrada/saída usam ISO date strings YYYY-MM-DD
 * em timezone local do usuário.
 */

// ── Conversões básicas ────────────────────────────────────────────

/** Converte um objeto Date para string ISO 'YYYY-MM-DD' (timezone local) */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte string 'YYYY-MM-DD' para Date em timezone local.
 * Usa sufixo 'T00:00:00' para evitar offset UTC que Date('YYYY-MM-DD') causa.
 */
export function fromISODate(str: string): Date {
  return new Date(`${str}T00:00:00`);
}

// ── Aritmética ────────────────────────────────────────────────────

/** Retorna uma nova YYYY-MM-DD adicionando `days` ao `isoDate` */
export function addDays(isoDate: string, days: number): string {
  const date = fromISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

// ── Comparações ───────────────────────────────────────────────────

/** Retorna a data de hoje no formato 'YYYY-MM-DD' */
function getTodayISO(): string {
  return toISODate(new Date());
}

/** Retorna true se `isoDate` for o dia de hoje */
export function isToday(isoDate: string): boolean {
  return isoDate === getTodayISO();
}

/** Retorna true se `isoDate` for anterior a hoje */
export function isPast(isoDate: string): boolean {
  return isoDate < getTodayISO();
}

// ── Formatação ────────────────────────────────────────────────────

/**
 * Formata uma ISO date para exibição na navegação:
 *   - Se for hoje → "Hoje, 16 jun"
 *   - Outros dias → "Qui, 19 jun"
 *
 * Usa Intl.DateTimeFormat com locale pt-BR.
 */
export function formatDayLabel(isoDate: string): string {
  const date = fromISODate(isoDate);

  const dayMonthFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
  });

  // Remove o ponto final que pt-BR adiciona no mês abreviado ("jun." → "jun")
  const dayMonth = dayMonthFormatter
    .format(date)
    .replace(/\.$/, '')
    .replace(' de ', ' ');

  if (isToday(isoDate)) {
    return `Hoje, ${dayMonth}`;
  }

  const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
  });

  // Capitaliza primeira letra e remove ponto final ("qui." → "Qui")
  const weekday = weekdayFormatter
    .format(date)
    .replace(/\.$/, '');
  const weekdayCapitalized =
    weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${weekdayCapitalized}, ${dayMonth}`;
}
