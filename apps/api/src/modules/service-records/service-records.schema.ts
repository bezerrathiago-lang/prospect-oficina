/**
 * Zod schemas para o módulo de registros de atendimento
 */
import { z } from 'zod';

// ── Request Schemas ─────────────────────────────────────────────

export const CreateServiceRecordSchema = z
  .object({
    customer_name: z
      .string({ error: 'Nome do cliente é obrigatório.' })
      .min(3, { message: 'Nome deve ter no mínimo 3 caracteres.' })
      .max(200, { message: 'Nome deve ter no máximo 200 caracteres.' }),
    customer_phone: z
      .string({ error: 'Telefone é obrigatório.' })
      .regex(/^\(\d{2}\) \d{5}-\d{4}$/, {
        message: 'Telefone deve estar no formato (XX) XXXXX-XXXX.',
      }),
    service_type_id: z
      .number({ error: 'Tipo de serviço é obrigatório.' })
      .int({ message: 'Tipo de serviço inválido.' })
      .positive({ message: 'Tipo de serviço inválido.' }),
    last_service_date: z
      .string({ error: 'Data do último serviço é obrigatória.' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Data deve estar no formato YYYY-MM-DD.',
      }),
    last_service_mileage: z
      .number({ error: 'Km no último serviço é obrigatório.' })
      .int({ message: 'Km deve ser um número inteiro.' })
      .positive({ message: 'Km deve ser um número positivo.' }),
    current_mileage: z
      .number({ error: 'Km atual é obrigatório.' })
      .int({ message: 'Km deve ser um número inteiro.' })
      .positive({ message: 'Km deve ser um número positivo.' }),
    next_service_mileage: z
      .number({ error: 'Km do próximo serviço é obrigatório.' })
      .int({ message: 'Km deve ser um número inteiro.' })
      .positive({ message: 'Km deve ser um número positivo.' }),
  })
  .superRefine((data, ctx) => {
    // Validação cruzada: current_mileage > last_service_mileage
    if (data.current_mileage <= data.last_service_mileage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['current_mileage'],
        message: 'Km atual deve ser maior que km do último serviço.',
      });
    }

    // Validação cruzada: next_service_mileage > current_mileage
    if (data.next_service_mileage <= data.current_mileage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['next_service_mileage'],
        message: 'Km do próximo serviço deve ser maior que km atual.',
      });
    }

    // Validação: data do último serviço não pode ser futura nem igual a hoje
    const lastDate = new Date(data.last_service_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lastDate >= today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['last_service_date'],
        message:
          'Data do último serviço deve ser anterior a hoje (ao menos 1 dia de diferença).',
      });
    }
  });

export type CreateServiceRecordBody = z.infer<typeof CreateServiceRecordSchema>;

// ── Response Schemas ────────────────────────────────────────────

export const CustomerResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;

export const ServiceRecordResponseSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  service_type_id: z.number(),
  consultant_id: z.number(),
  last_service_date: z.string(),
  last_service_mileage: z.number(),
  current_mileage: z.number(),
  next_service_mileage: z.number(),
  next_service_date: z.string(),
  daily_average_km: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ServiceRecordResponse = z.infer<typeof ServiceRecordResponseSchema>;

export const TaskResponseSchema = z.object({
  id: z.number(),
  service_record_id: z.number(),
  customer_id: z.number(),
  consultant_id: z.number(),
  scheduled_date: z.string(),
  status: z.enum(['pending', 'completed_scheduled', 'completed_rescheduled', 'abandoned']),
  attempt_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type TaskResponse = z.infer<typeof TaskResponseSchema>;

export const CreateServiceRecordResponseSchema = z.object({
  service_record: ServiceRecordResponseSchema,
  customer: CustomerResponseSchema,
  task: TaskResponseSchema,
});

export type CreateServiceRecordResponse = z.infer<
  typeof CreateServiceRecordResponseSchema
>;
