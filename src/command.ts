import { InstallGlobalCommands } from './utils'

const testCommand = {
  name: 'test',
  description: 'Basic command',
  type: 1,
}

const leaveCommand = {
  name: 'leave',
  description: 'Take a leave with specified dates',
  options: [
    {
      type: 3,
      name: 'date',
      description: 'Type your leave date in format (DD/MM/YYYY). EX: 31/05/2024',
      required: true,
    },
  ],
  type: 1,
}

InstallGlobalCommands(
  Bun.env.APP_ID || '',
  [testCommand, leaveCommand],
).then(() => console.log('register success !!')).catch(reason => console.error(new Error(reason)))
