import { Elysia } from 'elysia'
import { client } from './db'

await client.connect().then(() => console.info('connect success!!'))

const app = new Elysia().get('/', () => 'Hello Elysia').listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
