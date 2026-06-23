/**
 * Zod schemas para o módulo de tentativas de contato (Stories 4.1, 4.2, 4.3)
 *
 * Body discriminado pelo campo `outcome`:
 *   - 'scheduled'   → requer appointment_date
 *   - 'rescheduled' → requer rescheduled_date (>= amanhã)
 *   - 'abandoned'   → requer abandonment_reason_id; abandonment_notes obrigatório se is_other=true
 */
import { z } from 'zod';

// ── Sub-schemas por outcome ──────────────────────────────────────

const ScheduledBody = z.object({
  task_id: z
    .number({ error: 'task_id é obrigatório.' })
    .int()
    .positive(),
  outcome: z.literal('scheduled'),
  appointment_date: z
    .string({ error: 'Data do agendamento é obrigatória.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data deve estar no formato YYYY-MM-DD.' }),
});

const RescheduledBody = z
  .object({
    task_id: z
      .number({ error: 'task_id é obrigatório.' })
      .int()
      .positive(),
    outcome: z.literal('rescheduled'),
    rescheduled_date: z
      .string({ error: 'Nova data para ligar é obrigatória.' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data deve estar no formato YYYY-MM-DD.' }),
  })
  .superRefine((data, ctx) => {
    // Validação: rescheduled_date deve ser >= amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const rescheduleDate = new Date(data.rescheduled_date + 'T00:00:00');

    if (rescheduleDate < tomorrow) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rescheduled_date'],
        message: 'A nova data deve ser a partir de amanhã.',
      });
    }
  });

const AbandonedBody = z.object({
  task_id: z
    .number({ error: 'task_id é obrigatório.' })
    .int()
    .positive(),
  outcome: z.literal('abandoned'),
  abandonment_reason_id: z
    .number({ error: 'Motivo de desistência é obrigatório.' })
    .int()
    .positive(),
  abandonment_notes: z.string().optional(),
});

// "Não chegou na km": consultor informa a nova km medida hoje;
// o sistema recalcula a previsão e reagenda a tarefa automaticamente.
const RemeasuredBody = z.object({
  task_id: z
    .number({ error: 'task_id é obrigatório.' })
    .int()
    .positive(),
  outcome: z.literal('remeasured'),
  new_mileage: z
    .number({ error: 'Quilometragem atual é obrigatória.' })
    .int({ message: 'Km deve ser um número inteiro.' })
    .positive({ message: 'Km deve ser um número positivo.' }),
});

// ── Union discriminada ───────────────────────────────────────────

export const RegisterContactAttemptSchema = z.discriminatedUnion('outcome', [
  ScheduledBody,
  RescheduledBody,
  AbandonedBody,
  RemeasuredBody,
]);

export type RegisterContactAttemptBody = z.infer<typeof RegisterContactAttemptSchema>;
export type ScheduledBody = z.infer<typeof ScheduledBody>;
export type RescheduledBody = z.infer<typeof RescheduledBody>;
export type AbandonedBody = z.infer<typeof AbandonedBody>;
export type RemeasuredBody = z.infer<typeof RemeasuredBody>;
