import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { vacationUsersTable } from './schema'

const client = postgres(Bun.env.DB_URL!)

export const db = drizzle(client, { schema: { vacationUsersTable } })
