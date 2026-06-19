/**
 * Serviço de tipos de serviço
 *
 * Responsabilidades:
 *   - list: lista tipos ativos (ou todos se includeInactive=true)
 *   - findById: busca tipo por ID, lança 404 se não encontrado
 *   - create: insere novo tipo de serviço
 *   - update: atualiza campos parcialmente (PATCH)
 */
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { serviceTypes } from '../../db/schema.js';
import type { CreateServiceTypeBody, UpdateServiceTypeBody, ServiceTypeResponse } from './service-types.schema.js';

// ── Helpers ─────────────────────────────────────────────────────

function toResponse(row: typeof serviceTypes.$inferSelect): ServiceTypeResponse {
  return {
    id: row.id,
    name: row.name,
    contact_lead_days: row.contactLeadDays,
    is_active: row.isActive === 1,
    created_at: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : new Date((row.createdAt as number) * 1000).toISOString(),
    updated_at: row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : new Date((row.updatedAt as number) * 1000).toISOString(),
  };
}

// ── Service Functions ────────────────────────────────────────────

/**
 * Lista tipos de serviço.
 * Por padrão retorna apenas ativos; se includeInactive=true retorna todos.
 */
export async function list(includeInactive = false): Promise<ServiceTypeResponse[]> {
  const db = getDb();

  const rows = includeInactive
    ? await db.select().from(serviceTypes).orderBy(serviceTypes.name)
    : await db
        .select()
        .from(serviceTypes)
        .where(eq(serviceTypes.isActive, 1))
        .orderBy(serviceTypes.name);

  return rows.map(toResponse);
}

/**
 * Busca tipo de serviço por ID.
 * Lança erro 404 se não encontrado (via httpErrors do fastify-sensible).
 */
export async function findById(id: number): Promise<ServiceTypeResponse> {
  const db = getDb();

  const [row] = await db
    .select()
    .from(serviceTypes)
    .where(eq(serviceTypes.id, id))
    .limit(1);

  if (!row) {
    const err = Object.assign(new Error('Tipo de serviço não encontrado.'), {
      statusCode: 404,
    });
    throw err;
  }

  return toResponse(row);
}

/**
 * Cria novo tipo de serviço.
 */
export async function create(data: CreateServiceTypeBody): Promise<ServiceTypeResponse> {
  const db = getDb();

  const result = await db
    .insert(serviceTypes)
    .values({
      name: data.name,
      contactLeadDays: data.contact_lead_days,
      isActive: 1,
    })
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error('Falha ao criar tipo de serviço.');
  }

  return toResponse(row);
}

/**
 * Atualiza tipo de serviço parcialmente (PATCH).
 * Lança 404 se não encontrado.
 */
export async function update(
  id: number,
  data: UpdateServiceTypeBody,
): Promise<ServiceTypeResponse> {
  const db = getDb();

  // Verifica se existe
  await findById(id);

  const updateValues: Partial<typeof serviceTypes.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updateValues.name = data.name;
  }
  if (data.contact_lead_days !== undefined) {
    updateValues.contactLeadDays = data.contact_lead_days;
  }
  if (data.is_active !== undefined) {
    updateValues.isActive = data.is_active ? 1 : 0;
  }

  const result = await db
    .update(serviceTypes)
    .set(updateValues)
    .where(eq(serviceTypes.id, id))
    .returning();

  const row = result[0];
  if (!row) {
    throw new Error('Falha ao atualizar tipo de serviço.');
  }

  return toResponse(row);
}
