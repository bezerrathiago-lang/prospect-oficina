import { integer, real, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================
// TABELA: abandonment_reasons
// Motivos pré-definidos de desistência de prospecção (Story 4.3)
// ============================================================
export const abandonmentReasons = sqliteTable('abandonment_reasons', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  isOther: integer('is_other').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================
// TABELA: users
// Consultores e gestores que acessam o sistema
// ============================================================
export const users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['consultant', 'manager'] })
    .notNull()
    .default('consultant'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================
// TABELA: service_types
// Tipos de serviço disponíveis na oficina (Story 2.1)
// ============================================================
export const serviceTypes = sqliteTable('service_types', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contactLeadDays: integer('contact_lead_days').notNull().default(15),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================
// TABELA: customers
// Clientes das motos (Story 2.2)
// ============================================================
export const customers = sqliteTable('customers', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================
// TABELA: service_records
// Registros de atendimento (Story 2.2)
// ============================================================
export const serviceRecords = sqliteTable('service_records', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id', { mode: 'number' })
    .notNull()
    .references(() => customers.id),
  serviceTypeId: integer('service_type_id', { mode: 'number' })
    .notNull()
    .references(() => serviceTypes.id),
  consultantId: integer('consultant_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  lastServiceDate: integer('last_service_date', { mode: 'timestamp' }).notNull(),
  lastServiceMileage: integer('last_service_mileage').notNull(),
  currentMileage: integer('current_mileage').notNull(),
  nextServiceMileage: integer('next_service_mileage').notNull(),
  nextServiceDate: integer('next_service_date', { mode: 'timestamp' }).notNull(),
  dailyAverageKm: real('daily_average_km').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================
// TABELA: tasks
// Tarefas de prospecção geradas automaticamente (Story 2.2)
// ============================================================
export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    serviceRecordId: integer('service_record_id', { mode: 'number' })
      .notNull()
      .references(() => serviceRecords.id),
    customerId: integer('customer_id', { mode: 'number' })
      .notNull()
      .references(() => customers.id),
    consultantId: integer('consultant_id', { mode: 'number' })
      .notNull()
      .references(() => users.id),
    scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
    status: text('status', {
      enum: ['pending', 'completed_scheduled', 'completed_rescheduled', 'abandoned'],
    })
      .notNull()
      .default('pending'),
    attemptCount: integer('attempt_count').notNull().default(0),
    appointmentDate: integer('appointment_date', { mode: 'timestamp' }),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    consultantDateIdx: index('idx_tasks_consultant_date').on(
      table.consultantId,
      table.scheduledDate,
    ),
  }),
);

// ============================================================
// TABELA: contact_attempts
// Tentativas de contato registradas pelo consultor (Stories 4.1, 4.2, 4.3)
// ============================================================
export const contactAttempts = sqliteTable('contact_attempts', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  taskId: integer('task_id', { mode: 'number' })
    .notNull()
    .references(() => tasks.id),
  consultantId: integer('consultant_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  outcome: text('outcome', {
    enum: ['scheduled', 'rescheduled', 'abandoned'],
  }).notNull(),
  appointmentDate: integer('appointment_date', { mode: 'timestamp' }),
  rescheduledDate: integer('rescheduled_date', { mode: 'timestamp' }),
  nextTaskId: integer('next_task_id', { mode: 'number' }).references(
    () => tasks.id,
  ),
  abandonmentReasonId: integer('abandonment_reason_id', { mode: 'number' }).references(
    () => abandonmentReasons.id,
  ),
  abandonmentNotes: text('abandonment_notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================
// TABELA: refresh_tokens
// Tokens de renovação de sessão (Story 1.2)
// ============================================================
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
});
