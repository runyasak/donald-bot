export interface DiscordRequestCommand {
  name: string
  description: string
  options?: {
    type: number
    name: string
    description: string
    required?: boolean
    choices?: {
      name: string
      value: string | number
    }[]
  }[]
  type: number
  autocomplete?: boolean
}

export interface DiscordRequestBody {
  app_permissions: string
  application_id: string
  authorizing_integration_owners: unknown
  data?: {
    id?: string
    name: string
    options?: {
      name: string
      type?: number
      value: string
    }[]
    type?: 1
  }
  entitlement_sku_ids: string[]
  entitlements: unknown[]
  guild: {
    features: unknown[]
    id: string
    locale: string
  }
  guild_id: string
  guild_locale: string
  id: string
  locale: string
  member?: {
    avatar: unknown | null
    communication_disabled_until: unknown | null
    deaf: boolean
    flags: number
    joined_at: string
    mute: false
    nick: string | null
    pending: boolean
    permissions: string
    premium_since: string | null
    roles: string[]
    unusual_dm_activity_until: unknown | null
    user: {
      avatar: string
      avatar_decoration_data: unknown | null
      clan: unknown | null
      discriminator: string
      global_name: string
      id: string
      public_flags: 0
      username: string
    }
  }
  token: string
  type: number
  user?: {
    avatar: string
    avatar_decoration_data: unknown | null
    bot: true
    clan: unknown | null
    discriminator: string
    global_name: string
    id: string
    public_flags: number
    system: true
    username: string
  }
  version: number
}
