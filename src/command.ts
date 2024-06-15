import { installGlobalCommands } from './utils'

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

const leaveFromToCommand = {
  name: 'leave-from-to',
  description: 'Take a leave with specified range of dates',
  options: [
    {
      type: 3,
      name: 'from',
      description: 'Type your start of leaving date in format (DD/MM/YYYY). EX: 31/05/2024',
      required: true,
    },
    {
      type: 3,
      name: 'to',
      description: 'Type your end of leaving date in format (DD/MM/YYYY). EX: 31/05/2024',
      required: true,
    },
  ],
  type: 1,
}

const leaveTodayCommand = {
  name: 'leave-today',
  description: 'Take a leave today',
  type: 1,
}

installGlobalCommands(
  Bun.env.APP_ID || '',
  [testCommand, leaveCommand, leaveFromToCommand, leaveTodayCommand],
).then(() => console.log('register success !!')).catch(reason => console.error(new Error(reason)))
