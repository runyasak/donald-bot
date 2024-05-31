import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { vacationUsersTable } from './schema'

export const client = new Client({
  connectionString: Bun.env.DB_CONNECTION_STRING,
  ssl: true,
})

export const db = drizzle(client, { schema: { vacationUsersTable } })
