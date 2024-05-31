import type { DiscordRequestCommand } from './model'

export async function installGlobalCommands(appId: string, commands: DiscordRequestCommand[]) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await discordRequest(endpoint, { method: 'PUT', body: commands as unknown as BodyInit })
  }
  catch (err) {
    console.error(err)
  }
}

export async function discordRequest(endpoint: string, options: Omit<FetchRequestInit, 'body'> & { body: any }) {
  const url = `https://discord.com/api/v10/${endpoint}`

  if (options.body)
    options.body = JSON.stringify(options.body)

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bot ${Bun.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/runyasak/donald-bot, 1.0.0)',
    },
    ...options,
  })

  if (!res.ok) {
    const data = await res.json()
    console.log(res.status)
    throw new Error(JSON.stringify(data))
  }

  return res
}
