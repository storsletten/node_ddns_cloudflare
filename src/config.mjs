import { pathToFileURL } from 'node:url'
import { basename, resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { error, warn } from './logger.mjs'

export const config = {}

const defaultFilePath = 'config.json'
const defaultValidatorPrefix = '__'

export async function initConfig({
 filePath,
 defaultConfig,
 shouldSaveConfig,
 continueAfterCreatingConfig,
 validatorPrefix,
}) {
 if (defaultConfig?.constructor !== Object) throw new TypeError(
  `defaultConfig must be a regular object`
 )
 if (validatorPrefix === false) validatorPrefix = null
 else if (!validatorPrefix) validatorPrefix = defaultValidatorPrefix
 else if (typeof validatorPrefix !== 'string') throw new TypeError(
  `validatorPrefix must be a string, or use false to disable the feature`
 )

 filePath = resolve(filePath ?? defaultFilePath)
 const fileName = basename(filePath)
 const setConfig = (newConfig) => {
  for (const key in config) delete config[key]
  Object.assign(config, JSON.parse(JSON.stringify(newConfig)))
 }
 const saveConfig = () => writeFile(filePath, JSON.stringify(config, null, 1))

 try {
  const userConfig = (await import(
   pathToFileURL(filePath),
   { with: { type: 'json' } }
  )).default
  if (userConfig?.constructor !== Object) throw new TypeError(
   `JSON file ${fileName} is not a regular object`
  )
  const newConfig = {}
  const objects = [{ propPath: [], newConfig, defaultConfig, userConfig }]
  for (const { propPath, newConfig, defaultConfig, userConfig } of objects) {
   for (const key in defaultConfig) {
    if (validatorPrefix && key.startsWith(validatorPrefix)) continue
    const val = defaultConfig[key]
    if (val !== undefined && !userConfig.hasOwnProperty(key)) {
     newConfig[key] = val
     if (shouldSaveConfig == null) shouldSaveConfig = true
    }
   }
   for (const key in userConfig) {
    const defaultVal = defaultConfig[key]
    if (defaultVal === undefined) {
     if (shouldSaveConfig == null) shouldSaveConfig = true
    } else {
     const userVal = userConfig[key]
     const getPropPath = () => [...propPath, key].map(key => (
      key.match(/^[^\.\s`"']+$/)?.[0] ||
      `"${key.replace(/["\\]/g, s => `\\${s}`)}"`
     )).join('.')
     if (defaultVal !== null && defaultVal.constructor !== userVal?.constructor) throw new TypeError(
      `In ${fileName}, expected the type of ${getPropPath()} to be ${defaultVal.constructor.name} (not ${userVal?.constructor.name ?? userVal})`
     )
     let newVal
     if (validatorPrefix) {
      try { newVal = defaultConfig[validatorPrefix + key]?.(userVal, defaultVal) }
      catch (err) {
       throw new Error(
        `Failed validation of ${getPropPath()} in ${fileName}`,
        { cause: err }
       )
      }
     }
     if (newVal === undefined) newVal = userVal
     if (defaultVal?.constructor === Object && newVal?.constructor === Object) {
      newConfig[key] = {}
      objects.push({
       propPath: [...propPath, key],
       newConfig: newConfig[key],
       defaultConfig: defaultVal,
       userConfig: newVal,
      })
     } else {
      newConfig[key] = newVal
      if (shouldSaveConfig == null) {
       if (Array.isArray(newVal)) {
        if (JSON.stringify(newVal) !== JSON.stringify(userVal)) {
         shouldSaveConfig = true
        }
       }
       else if (newVal !== userVal) shouldSaveConfig = true
      }
     }
    }
   }
  }
  setConfig(newConfig)
  if (shouldSaveConfig) {
   await saveConfig()
   warn(`Updated file ${fileName}`)
  }
 } catch (err) {
  setConfig(defaultConfig)
  if (err.code === 'ERR_MODULE_NOT_FOUND') {
   if (shouldSaveConfig == null || shouldSaveConfig) {
    await saveConfig()
    if (continueAfterCreatingConfig) warn(`Created file ${fileName}`)
    else {
     warn(`Created file ${fileName}. Use it to customize the configuration, then re-launch the app`)
     process.exit()
    }
   }
   else warn(`${fileName} does not exist, and shouldSaveConfig is explicitly negated. Therefore running with defaultConfig`)
  }
  else throw err
 }
}

export default { config, initConfig }
