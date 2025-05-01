import { writeFile, readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { fatal } from './logger.mjs'

export async function singleton({
 filePath = 'app.pid',
 debounceDelay = 250,
} = {}) {
 await writeFile(filePath, String(process.pid))

 const watcher = watch(filePath, { persistent: true }, async (eventType) => {
  if (eventType !== 'change' && eventType !== 'rename') return
  await sleep(debounceDelay)
  try {
   const fileContent = await readFile(filePath)
   if (process.pid !== parseInt(fileContent)) {
    fatal(`PID file has changed`)
    process.exit(1)
   }
  } catch (err) {
   fatal(`PID file unreadable`)
   process.exit(1)
  }
 })

 await sleep(debounceDelay)

 return watcher
}

export default singleton
