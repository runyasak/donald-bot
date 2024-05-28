import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './postgresql/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: Bun.env.DB_MIGRATION_CONNECTION_STRING || Bun.env.DB_CONNECTION_STRING || '',
  },
})
