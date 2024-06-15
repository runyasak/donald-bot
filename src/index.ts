import { Elysia } from 'elysia'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { cron } from '@elysiajs/cron'
import { logger } from '@bogeychan/elysia-logger'
import type { Logger } from '@bogeychan/elysia-logger/src/types'
import { db } from './db'
import type { DiscordRequestBody } from './model'
import type { InsertVacationUsers, SelectVacationUsers } from './schema'
import { vacationUsersTable } from './schema'
import { discordRequest } from './utils'

dayjs.extend(customParseFormat)

const DATE_FORMAT = 'DD/MM/YYYY'

const INVALID_DATE_RESPONSE = {
  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
  data: {
    content: 'วันที่ไม่ตรงตาม format นะ 🤬 EX: 31/05/2024',
  },
}

const app = new Elysia()
  .use(
    logger({
      level: 'error',
    }),
  )
  .use(
    cron({
      name: 'vacation_users',
      pattern: '30 02 * * 1-5',
      async run() {
        const today = dayjs().startOf('day').toDate()
        const vacationUsers = await db.query.vacationUsersTable.findMany({
          where: (users, { eq }) => eq(users.leftAt, today),
        })

        const content = vacationUsers.length === 0
          ? `<@&${Bun.env.VACATION_USERS_NOTIFICATION_MENTION_ROLE_ID}> วันนี้ไม่มีคนลานะทุกคน`
          : `<@&${Bun.env.VACATION_USERS_NOTIFICATION_MENTION_ROLE_ID}> วันนี้คนที่ลาคือ ${mapJoinUserNickname(vacationUsers)}`

        discordRequest(`/channels/${Bun.env.VACATION_USERS_NOTIFICATION_CHANNEL_ID}/messages`, {
          body: { content, tts: false },
          method: 'POST',
        })
      },
    }),
  )
  .onBeforeHandle(({ log, request }) => {
    log.error(request, 'Before Handle')
  })
  .post('/interactions', async ({ body, log }) => {
    const discordBody = body as DiscordRequestBody
    const { type, data } = discordBody as DiscordRequestBody
    const userId = discordBody.member?.user.id || ''
    const userNickname = discordBody.member?.nick
      || discordBody.member?.user.global_name
      || discordBody.member?.user.username
      || ''

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

        if (!leftAtInput || !dayjs(leftAtInput, DATE_FORMAT).isValid())
          return INVALID_DATE_RESPONSE

        const leftAt = dayjs(leftAtInput, DATE_FORMAT).toDate()

        try {
          await db.insert(vacationUsersTable).values({ userId, userNickname, leftAt })

          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `ทุกคน เดี๋ยว <@${userId}> จะลาวันที่ ${leftAtInput} นะ`,
            },
          }
        }
        catch (error) {
          log.error(error, 'DB')
        }
      }

      if (name === 'leave-from-to') {
        const leftFromAtInput = data.options && data.options.find(option => option.name === 'from')?.value
        const leftToAtInput = data.options && data.options.find(option => option.name === 'to')?.value

        const leftFromDayjs = dayjs(leftFromAtInput, DATE_FORMAT)
        const leftToDayjs = dayjs(leftToAtInput, DATE_FORMAT)

        if (!leftFromAtInput || !leftToAtInput || !leftFromDayjs.isValid() || !leftToDayjs.isValid())
          return INVALID_DATE_RESPONSE

        if (leftFromDayjs.diff(leftToDayjs, 'days') > 0) {
          return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: 'ใส่ from ให้น้อยกว่า to สิ 🤬',
            },
          }
        }

        const diffDays = leftToDayjs.diff(leftFromDayjs, 'days')

        const insertVacationData = Array.from(
          { length: diffDays + 1 },
          (_, index) => {
            const leftAt = leftFromDayjs.add(index, 'day')
            return {
              userId,
              userNickname,
              leftAt: !isWeekend(leftAt) ? leftAt.toDate() : null,
            }
          },
        ).filter(value => value.leftAt !== null) as {
          userId: string
          userNickname: string
          leftAt: Date
        }[]

        try {
          await db.insert(vacationUsersTable).values(insertVacationData)
        }
        catch (error) {
          log.error(error, 'DB')
        }

        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `ทุกคน เดี๋ยว <@${userId}> จะลาตั้งแต่วันที่ ${leftFromAtInput} ถึง ${leftToAtInput} นะ`,
          },
        }
      }

      if (name === 'leave-today') {
        const todayDayjs = dayjs()

        return createUserVacation(
          { userId, userNickname, leftAt: todayDayjs.toDate() },
          log,
          `ทุกคนวันนี้ <@${userId}> ลาหยุดนะ`,
        )
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

async function createUserVacation({ userId, userNickname, leftAt }: InsertVacationUsers, log: Logger, content = '') {
  try {
    await db.insert(vacationUsersTable).values({ userId, userNickname, leftAt })

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: content || `ทุกคน เดี๋ยว <@${userId}> จะลาวันที่ ${dayjs(leftAt).format(DATE_FORMAT)} นะ`,
      },
    }
  }
  catch (error) {
    log.error(error, 'DB')
  }
}

function mapJoinUserNickname<T extends SelectVacationUsers>(users: T[]) {
  return users.map(user => user.userNickname).join(', ')
}

function isWeekend(value: Dayjs) {
  return [0, 6].includes(value.day())
}

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
