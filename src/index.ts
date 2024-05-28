import { Elysia, t } from 'elysia'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import { client } from './db'

await client.connect().then(() => console.info('connect success!!'))

const app = new Elysia()
  .post('/interactions', (req) => {
    const { type, data } = req.body

    if (type === InteractionType.PING)
      return { type: InteractionResponseType.PONG }

    if (type === InteractionType.APPLICATION_COMMAND && data) {
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
    body: t.Object({
      type: t.Numeric(),
      data: t.Optional(
        t.Object({
          name: t.String(),
        }),
      ),
      id: t.Numeric(),
    }),
  })
  .get('/', () => 'Hello Elysia')
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
