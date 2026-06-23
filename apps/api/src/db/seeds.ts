/**
 * Seeds de desenvolvimento — cria dados iniciais para testes
 *
 * ATENÇÃO: As senhas aqui são apenas para desenvolvimento local.
 * Em produção, troque as senhas dos usuários seed imediatamente após o deploy.
 * Nunca use estas credenciais em ambiente de produção.
 *
 * Executar via: pnpm db:seed
 */
import { config } from 'dotenv';
config();

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';
import { hashPassword } from '../lib/hash.js';

const url = process.env['DATABASE_URL'];
if (!url) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = createClient({ url });
const db = drizzle(client, { schema });

// ── Service Types Seed ───────────────────────────────────────────

// contactLeadDays agora representa DIAS ÚTEIS de antecedência para a tarefa
const seedServiceTypes = [
  { name: 'Revisão', contactLeadDays: 5 },
  { name: 'Troca de Peças', contactLeadDays: 5 },
];

console.log('Seeding service types...');

for (const seed of seedServiceTypes) {
  const [existing] = await db
    .select({ id: schema.serviceTypes.id })
    .from(schema.serviceTypes)
    .where(eq(schema.serviceTypes.name, seed.name))
    .limit(1);

  if (existing) {
    // Alinha o lead time dos tipos já existentes para o novo padrão (dias úteis)
    await db
      .update(schema.serviceTypes)
      .set({ contactLeadDays: seed.contactLeadDays, updatedAt: new Date() })
      .where(eq(schema.serviceTypes.id, existing.id));
    console.log(`  [upd]  ${seed.name} → ${seed.contactLeadDays} dias úteis`);
    continue;
  }

  await db.insert(schema.serviceTypes).values({
    name: seed.name,
    contactLeadDays: seed.contactLeadDays,
    isActive: 1,
  });

  console.log(`  [ok]   ${seed.name} (${seed.contactLeadDays} dias úteis)`);
}

// ── Users Seed ───────────────────────────────────────────────────

const seedUsers = [
  {
    email: 'manager@prospectmoto.com',
    password: 'manager123',
    name: 'Gerente',
    role: 'manager' as const,
  },
  {
    email: 'consultor@prospectmoto.com',
    password: 'consultor123',
    name: 'Consultor Demo',
    role: 'consultant' as const,
  },
];

console.log('Seeding users...');

for (const seed of seedUsers) {
  // Check if user already exists
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, seed.email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`  [skip] ${seed.email} — already exists`);
    continue;
  }

  const passwordHash = await hashPassword(seed.password);

  await db.insert(schema.users).values({
    email: seed.email,
    passwordHash,
    name: seed.name,
    role: seed.role,
  });

  console.log(`  [ok]   ${seed.email} (${seed.role})`);
}

// ── Abandonment Reasons Seed ─────────────────────────────────────

const seedAbandonmentReasons = [
  { label: 'Cliente sem interesse', isOther: 0, sortOrder: 1 },
  { label: 'Telefone inválido ou não atende', isOther: 0, sortOrder: 2 },
  { label: 'Cliente foi para outra oficina', isOther: 0, sortOrder: 3 },
  { label: 'Muitas tentativas sem retorno', isOther: 0, sortOrder: 4 },
  { label: 'Cliente solicitou não ser contatado', isOther: 0, sortOrder: 5 },
  { label: 'Outros', isOther: 1, sortOrder: 6 },
];

console.log('Seeding abandonment reasons...');

for (const seed of seedAbandonmentReasons) {
  const existing = await db
    .select({ id: schema.abandonmentReasons.id })
    .from(schema.abandonmentReasons)
    .where(eq(schema.abandonmentReasons.label, seed.label))
    .limit(1);

  if (existing.length > 0) {
    console.log(`  [skip] ${seed.label} — already exists`);
    continue;
  }

  await db.insert(schema.abandonmentReasons).values({
    label: seed.label,
    isOther: seed.isOther,
    sortOrder: seed.sortOrder,
    isActive: 1,
  });

  console.log(`  [ok]   ${seed.label} (sort_order=${seed.sortOrder})`);
}

console.log('Seed completed successfully.');
client.close();
