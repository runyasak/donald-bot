import { Elysia } from 'elysia'
import { verifyKey } from 'discord-interactions'
import { client } from './db'

await client.connect().then(() => console.info('connect success!!'))

const app = new Elysia()
  .onBeforeHandle(({ request, set, body }) => {
    const signature = request.headers.get('X-Signature-Ed25519')
    const timestamp = request.headers.get('X-Signature-Timestamp')

    if (!signature || !timestamp)
      return

    const isValidRequest = verifyKey(body as string, signature, timestamp, Bun.env.PUBLIC_KEY || '')

    if (!isValidRequest) {
      set.status = 401
      return 'Bad request signature'
    }
  })
  .get('/', () => 'Hello Elysia')
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
