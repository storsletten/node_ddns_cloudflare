import { open, readdir, rename, stat, unlink } from 'node:fs/promises'
import { join, format, parse, resolve } from 'node:path'
import { EOL } from 'node:os'
import { pad0 } from './format.mjs'
import * as logger from './logger.mjs'

export * from './logger.mjs'

export const defaultFilePath = 'app.log'
export const defaultFileSizeThreshold = 1000000
export const defaultMaxRotatedFiles = 10

export async function useStorage(options) {
 filePath = undefined
 if (fileHandle) {
  await fileHandle.close()
  fileHandle = undefined
  isWriting = false
 }
 if (options === undefined) options = true
 else if (!options) {
  bytesWritten = filePathParts = rotatedFileCandidates = undefined
  return
 }

 if (typeof options !== 'object') options = {
  filePath: typeof options !== 'boolean' && options
 }

 filePath = resolve(options.filePath || defaultFilePath)
 fileSizeThreshold = options.fileSizeThreshold ?? defaultFileSizeThreshold
 maxRotatedFiles = options.maxRotatedFiles ?? defaultMaxRotatedFiles

 if (typeof fileSizeThreshold !== 'number' || fileSizeThreshold % 1 !== 0) throw new Error(
  `fileSizeThreshold must be an integer`
 )
 if (fileSizeThreshold < 1024) throw new Error(`fileSizeThreshold must be at least 1024 Bytes`)

 if (typeof maxRotatedFiles !== 'number' || maxRotatedFiles % 1 !== 0) throw new Error(
  `maxRotatedFiles must be an integer`
 )
 if (maxRotatedFiles < 1) throw new Error(`maxRotatedFiles must be greater than 0`)

 filePathParts = parse(filePath)
 const { name, ext } = filePathParts
 const padsize = Math.ceil(Math.log10(maxRotatedFiles))
 rotatedFileCandidates = Array.from(
  { length: maxRotatedFiles },
  (v, i) => `${name}-${pad0(i, padsize)}${ext}`
 )
 fileHandle = await open(filePath, 'a')
 bytesWritten = (await fileHandle.stat()).size
 await check()
}

async function check() {
 while (fileHandle && !isWriting) {
  if (bytesWritten < fileSizeThreshold) {
   await write()
   if (bytesWritten < fileSizeThreshold) break
  }
  const closed = fileHandle.close()
  fileHandle = undefined
  const { dir } = filePathParts
  const files = new Set(await readdir(dir))
  let index = rotatedFileCandidates.findIndex(c => !files.has(c))
  if (index === -1) {
   index = rotatedFileCandidates.length - 1
   await unlink(join(dir, rotatedFileCandidates[index]))
  }
  for (let i=index; i>0; i--) await rename(
   join(dir, rotatedFileCandidates[i - 1]),
   join(dir, rotatedFileCandidates[i])
  )
  await closed
  await rename(filePath, join(dir, rotatedFileCandidates[0]))
  if (!filePath) return
  fileHandle = await open(filePath, 'a')
  bytesWritten = 0
 }
}

export async function write(...msgs) {
 if (msgs.length > 0) msgQueue.push(...msgs)
 if (isWriting || !fileHandle || msgQueue.length === 0) return

 isWriting = true
 while (fileHandle && msgQueue.length > 0) {
  const chunk = msgQueue.join(EOL) + EOL
  msgQueue.length = 0
  bytesWritten += (await fileHandle.write(chunk)).bytesWritten
 }
 isWriting = false
 if (msgs.length > 0) await check()
}

export const msgQueue = []

export default {
 ...logger,
 defaultFilePath,
 defaultFileSizeThreshold,
 defaultMaxRotatedFiles,
 msgQueue,
 useStorage,
 write,
}


let bytesWritten, fileHandle, filePath, filePathParts, fileSizeThreshold, isWriting, maxRotatedFiles, rotatedFileCandidates

logger.categories.forEach(c => {
 c.store = ({ printMsg }) => {
  if (printMsg) write(printMsg)
 }
})
