import { pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const statusEnum = pgEnum('status', ['ACTIVE', 'INACTIVE'])

export const vacationUsersTable = pgTable('vacation_users', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  userNickname: text('user_nickname').notNull(),
  status: statusEnum('status').notNull().default('ACTIVE'),
  leftAt: timestamp('left_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
})

export type InsertVacationUsers = typeof vacationUsersTable.$inferInsert
export type SelectVacationUsers = typeof vacationUsersTable.$inferSelect
