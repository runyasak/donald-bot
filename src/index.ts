import { Elysia } from 'elysia'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { cron } from '@elysiajs/cron'
import { logger } from '@bogeychan/elysia-logger'
import { client, db } from './db'
import type { DiscordRequestBody } from './model'
import type { SelectVacationUsers } from './schema'
import { vacationUsersTable } from './schema'
import { discordRequest } from './utils'

dayjs.extend(customParseFormat)

const dateFormat = 'DD/MM/YYYY'

await client.connect()

const app = new Elysia()
  .use(
    logger({
      level: 'error',
    }),
  )
  .use(
    cron({
      name: 'vacation_users',
      pattern: '30 09 * * 1-5',
      async run() {
        const today = dayjs().startOf('day').toDate()
        const vacationUsers = await db.query.vacationUsersTable.findMany({
          where: (users, { eq }) => eq(users.leftAt, today),
        })

        const content = vacationUsers.length === 0
          ? `<@${Bun.env.VACATION_USERS_NOTIFICATION_MENTION_ROLE_ID}> วันนี้ไม่มีคนลานะทุกคน`
          : `<@${Bun.env.VACATION_USERS_NOTIFICATION_MENTION_ROLE_ID}> วันนี้คนที่ลาคือ ${mapJoinUserNickname(vacationUsers)}`

        discordRequest(`/channels/${Bun.env.VACATION_USERS_NOTIFICATION_CHANNEL_ID}/messages`, {
          body: { content, tts: false },
          method: 'POST',
        })
      },
    }),
  )
  .onBeforeHandle(({ log, request }) => {
    log.error(request, 'Error')
    log.info(request, 'Request Info') // noop
  })
  .post('/interactions', async ({ body }) => {
    const discordBody = body as DiscordRequestBody
    const { type, data } = discordBody as DiscordRequestBody

    if (type === InteractionType.PING)
      return { type: InteractionResponseType.PONG }

    if (type === InteractionType.APPLICATION_COMMAND && data) {
      const { name } = data

      if (name === 'test') {
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Hello Donald',
          },
        }
      }

      if (name === 'leave') {
        const leftAtInput = data.options && data.options.length > 0 ? data.options[0].value : null

        if (!leftAtInput || !dayjs(leftAtInput, dateFormat).isValid()) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: 'วันที่ไม่ตรงตาม format นะ 🤬 EX: 31/05/2024',
            },
          }
        }

        const userId = discordBody.member?.user.id || ''

        const leftAt = dayjs(leftAtInput, dateFormat).toDate()

        const userNickname = discordBody.member?.nick
          || discordBody.member?.user.global_name
          || discordBody.member?.user.username
          || ''

        await db.insert(vacationUsersTable).values({ userId, userNickname, leftAt })

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `ทุกคน เดี๋ยว <@${userId}> จะลาวันที่ ${leftAtInput} นะ`,
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
  .get('/', () => 'Hello Donald!!')
  .listen(3000)

function mapJoinUserNickname<T extends SelectVacationUsers>(users: T[]) {
  return users.map(user => user.userNickname).join(', ')
}

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
