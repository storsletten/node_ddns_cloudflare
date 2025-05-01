import { format } from 'node:util'
import { timeMsString } from './format.mjs'

export function debug(...args) { return logMessage(debug, args) }
export function error(...args) { return logMessage(error, args) }
export function fatal(...args) { return logMessage(fatal, args) }
export function info(...args) { return logMessage(info, args) }
export function tip(...args) { return logMessage(tip, args) }
export function warn(...args) { return logMessage(warn, args) }

export const categories = Object.freeze([fatal, error, warn, tip, info, debug])

export function logMessage(category, args) {
 if (category.noPrint && category.noStore) return
 const date = new Date()
 const letter = (
  (category.useEmoji ?? logMessage.useEmoji)
  ? category.emoji
  : category.letter
 )
 const timeString = timeMsString(date)
 const prefix = `${letter} ${timeString}`
 const msg = format(...args)
 const printMsg = `${prefix} ${msg}`
 const data = { args, category, date, msg, prefix, printMsg, timeString }
 return {
  data,
  printResult: category.noPrint ? undefined : category.print?.(printMsg),
  storeResult: category.noStore ? undefined : category.store?.(data),
 }
}

export function setLevel(level) {
 if (level == null) level = categories.length
 else if (typeof level !== 'number') {
  let found
  if (typeof level === 'string') {
   const lc = level.trim().toLowerCase()
   const uc = lc.toUpperCase()
   if (lc === 'all' || uc === 'A') found = categories.length
   else if (lc === 'none' || uc === 'N') found = -2
   else found = categories.findIndex(c => (c.name === lc || c.abbr === uc))
  }
  else found = categories.indexOf(level)
  if (found === -1) throw new Error(`Couldn't find logger category ${level}`)
  else level = Math.max(-1, found)
 }
 else level = Math.max(-1, Math.min(categories.length, Math.round(level)))
 categories.forEach((c, i) => { c.noStore = c.noPrint = (i > level) })
 return level
}

export default { debug, error, fatal, info, tip, warn, categories, logMessage, setLevel }


setLevel()

debug.emoji = '🐞'
debug.letter = 'D'
debug.print = console.debug.bind(console)
debug.purpose = 'DebugMessages'

error.emoji = '❌'
error.letter = 'E'
error.print = console.error.bind(console)
error.purpose = 'Errors'

fatal.emoji = '🔥'
fatal.letter = 'F'
fatal.print = console.error.bind(console)
fatal.purpose = 'FatalMessages'

info.emoji = '📝'
info.letter = 'I'
info.print = console.info.bind(console)
info.purpose = 'InfoMessages'

tip.emoji = '💡'
tip.letter = 'T'
tip.print = console.warn.bind(console)
tip.purpose = 'Tips'

warn.emoji = '🟡'
warn.letter = 'W'
warn.print = console.warn.bind(console)
warn.purpose = 'Warnings'


process.on('uncaughtException', (err) => {
 fatal('Uncaught Exception:', err)
 if (process.listeners('uncaughtException').length === 1) {
  process.exit(1)
 }
})

process.on('unhandledRejection', (reason, promise) => {
 fatal('Unhandled Rejection at:', promise, 'reason:', reason)
 if (process.listeners('unhandledRejection').length === 1) {
  process.exit(2)
 }
})
