/**
 * Zod schemas para o módulo de tipos de serviço
 */
import { z } from 'zod';

// ── Request Schemas ─────────────────────────────────────────────

export const CreateServiceTypeSchema = z.object({
  name: z
    .string({ error: 'Nome é obrigatório.' })
    .min(1, { message: 'Nome é obrigatório.' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres.' }),
  contact_lead_days: z
    .number({ error: 'Antecedência em dias é obrigatória.' })
    .int({ message: 'Antecedência deve ser um número inteiro.' })
    .min(1, { message: 'Antecedência deve ser pelo menos 1 dia.' })
    .default(15),
});

export type CreateServiceTypeBody = z.infer<typeof CreateServiceTypeSchema>;

export const UpdateServiceTypeSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Nome não pode ser vazio.' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres.' })
    .optional(),
  contact_lead_days: z
    .number()
    .int({ message: 'Antecedência deve ser um número inteiro.' })
    .min(1, { message: 'Antecedência deve ser pelo menos 1 dia.' })
    .optional(),
  is_active: z.boolean().optional(),
});

export type UpdateServiceTypeBody = z.infer<typeof UpdateServiceTypeSchema>;

// ── Response Schemas ────────────────────────────────────────────

export const ServiceTypeResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact_lead_days: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ServiceTypeResponse = z.infer<typeof ServiceTypeResponseSchema>;
