import { Buffer } from 'node:buffer'
import { Elysia } from 'elysia'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import { client } from './db'

await client.connect().then(() => console.info('connect success!!'))

const app = new Elysia()
  .post('/interactions', (req) => {
    const { type, id, data } = req.body as any

    console.log(id)

    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data

      if (name === 'test') {
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `hello Donald !!`,
          },
        }
      }
    }
  }, {
    async beforeHandle({ request, set }) {
      console.log('before handle !!')
      console.log(request.headers)
      const signature = request.headers.get('X-Signature-Ed25519')
      const timestamp = request.headers.get('X-Signature-Timestamp')

      if (!request.body)
        return

      const arrayBuffer = await Bun.readableStreamToArrayBuffer(request.body)
      const rawBody = Buffer.from(arrayBuffer)

      console.log('rawBody', rawBody)

      if (!signature || !timestamp)
        return

      const isValidRequest = verifyKey(rawBody, signature, timestamp, Bun.env.PUBLIC_KEY || '')

      if (!isValidRequest) {
        set.status = 401
        return 'Bad request signature'
      }
    },
  })
  .get('/', () => 'Hello Elysia')
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
