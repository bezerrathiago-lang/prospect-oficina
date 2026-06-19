/**
 * Serviço de motivos de desistência
 *
 * Responsabilidades:
 *   - list: retorna motivos ordenados por sort_order (apenas ativos por padrão)
 *   - create: insere novo motivo com sort_order = max + 1
 *   - update: atualiza label e/ou is_active (PATCH parcial)
 */
import { eq, asc, sql } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { abandonmentReasons } from '../../db/schema.js';

// ── Types ────────────────────────────────────────────────────────

export interface AbandonmentReasonItem {
  id: number;
  label: string;
  is_other: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface CreateAbandonmentReasonData {
  label: string;
}

export interface UpdateAbandonmentReasonData {
  label?: string;
  is_active?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────

function toItem(row: typeof abandonmentReasons.$inferSelect): AbandonmentReasonItem {
  return {
    id: row.id,
    label: row.label,
    is_other: row.isOther === 1,
    is_active: row.isActive === 1,
    sort_order: row.sortOrder,
  };
}

// ── Service Functions ─────────────────────────────────────────────

/**
 * Retorna motivos de desistência ordenados por sort_order.
 * Por padrão, retorna apenas ativos.
 * Se includeInactive=true, retorna todos.
 */
export async function list(includeInactive = false): Promise<AbandonmentReasonItem[]> {
  const db = getDb();

  const rows = includeInactive
    ? await db
        .select()
        .from(abandonmentReasons)
        .orderBy(asc(abandonmentReasons.sortOrder))
    : await db
        .select()
        .from(abandonmentReasons)
        .where(eq(abandonmentReasons.isActive, 1))
        .orderBy(asc(abandonmentReasons.sortOrder));

  return rows.map(toItem);
}

/**
 * Cria novo motivo de desistência.
 * sort_order = max(sort_order) + 1 para inserir ao final da lista.
 */
export async function create(data: CreateAbandonmentReasonData): Promise<AbandonmentReasonItem> {
  const db = getDb();

  // Calcular próximo sort_order
  const [maxRow] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${abandonmentReasons.sortOrder}), 0)` })
    .from(abandonmentReasons);

  const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

  const result = await db
    .insert(abandonmentReasons)
    .values({
      label: data.label,
      isOther: 0,
      sortOrder: nextOrder,
      isActive: 1,
    })
    .returning();

  const row = result[0];
  if (!row) throw new Error('Falha ao criar motivo de desistência.');

  return toItem(row);
}

/**
 * Atualiza motivo de desistência parcialmente (PATCH).
 * Lança 404 se não encontrado.
 */
export async function update(
  id: number,
  data: UpdateAbandonmentReasonData,
): Promise<AbandonmentReasonItem> {
  const db = getDb();

  // Verificar existência
  const [existing] = await db
    .select()
    .from(abandonmentReasons)
    .where(eq(abandonmentReasons.id, id))
    .limit(1);

  if (!existing) {
    const err = Object.assign(new Error('Motivo de desistência não encontrado.'), {
      statusCode: 404,
    });
    throw err;
  }

  const updateValues: Partial<typeof abandonmentReasons.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.label !== undefined) {
    updateValues.label = data.label;
  }
  if (data.is_active !== undefined) {
    updateValues.isActive = data.is_active ? 1 : 0;
  }

  const result = await db
    .update(abandonmentReasons)
    .set(updateValues)
    .where(eq(abandonmentReasons.id, id))
    .returning();

  const row = result[0];
  if (!row) throw new Error('Falha ao atualizar motivo de desistência.');

  return toItem(row);
}
