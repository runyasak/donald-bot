import { Elysia, t } from 'elysia'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import { client } from './db'
import type { DiscordRequestBody } from './model'

await client.connect().then(() => console.info('connect success!!'))

const app = new Elysia()
  .post('/interactions', (req) => {
    const { type, data } = req.body as DiscordRequestBody

    if (type === InteractionType.PING)
      return { type: InteractionResponseType.PONG }

    if (type === InteractionType.APPLICATION_COMMAND && data) {
      const { name } = data

      if (name === 'test') {
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'hello Donald !!',
          },
        }
      }

      if (name === 'leave') {
        console.log('body', req.body)
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'This is leave command!!',
          },
        }
      }
    }
  }, {
    async beforeHandle({ request, set, body }) {
      const signature = request.headers.get('X-Signature-Ed25519')
      const timestamp = request.headers.get('X-Signature-Timestamp')

      if (!signature || !timestamp)
        return

      const isValidRequest = verifyKey(
        JSON.stringify(body),
        signature,
        timestamp,
        Bun.env.PUBLIC_KEY || '',
      )

      if (!isValidRequest) {
        set.status = 401
        return 'Bad request signature'
      }
    },
  })
  .get('/', () => 'Hello Elysia')
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
