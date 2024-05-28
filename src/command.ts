import { InstallGlobalCommands } from './utils'

InstallGlobalCommands(
  Bun.env.APP_ID || '',
  [{ name: 'test', description: 'Basic command', type: 1 }],
).then(() => console.log('register success !!')).catch(reason => console.error(new Error(reason)))
