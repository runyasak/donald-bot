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
