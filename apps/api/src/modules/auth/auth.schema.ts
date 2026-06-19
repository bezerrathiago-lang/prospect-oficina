/**
 * Zod schemas para o módulo de autenticação
 */
import { z } from 'zod';

// ── Request Schemas ─────────────────────────────────────────────

export const LoginBodySchema = z.object({
  email: z
    .string({ error: 'E-mail é obrigatório.' })
    .email({ message: 'Formato de e-mail inválido.' })
    .toLowerCase(),
  password: z
    .string({ error: 'Senha é obrigatória.' })
    .min(1, { message: 'Senha é obrigatória.' }),
});

export type LoginBody = z.infer<typeof LoginBodySchema>;

// ── Response Schemas ────────────────────────────────────────────

export const UserPayloadSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['consultant', 'manager']),
});

export type UserPayload = z.infer<typeof UserPayloadSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: UserPayloadSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const MeResponseSchema = UserPayloadSchema;

export type MeResponse = z.infer<typeof MeResponseSchema>;

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});

export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
