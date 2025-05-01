import singleton from './singleton.mjs'
import { info, debug, useStorage } from './logger_file.mjs'
import { config, initConfig } from './config.mjs'
import { ipv4 } from './ipv4.mjs'
import { ipv6 } from './ipv6.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('dry')
const appInstanceName = args.find(
 v => v.startsWith('name=')
)?.slice(5).replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim() || 'app'

await initConfig({
 filePath: `${appInstanceName}-config.json`,
 defaultConfig: {
  updateIPv4: true,
  updateIPv6: false,
  interfaceName: '',
  domain: '',
  __domain: (val) => {
   if (!val) throw `domain must be set`
  },
  apiToken: '',
  __apiToken: (val) => {
   if (!val) throw `apiToken must be set`
  },
  zoneID: '',
  __zoneID: (val) => {
   if (!val) throw `zoneID must be set`
  },
  ttl: 60,
  __ttl: (val) => {
   if (val % 1 !== 0) throw `ttl must be a whole number`
   if (val < 60) throw `ttl must be at least 60 seconds`
  },
  proxied: false,
  minPollRateMS: 5000,
  __minPollRateMS: (val) => {
   if (val < 1000) throw `minPollRateMS must be at least 1000 milliseconds`
  },
  showDebugMessages: false,
 },
})

if (!config.updateIPv4 && !config.updateIPv6) throw new Error(
 `Neither IPv4 nor IPv6 is enabled in the config`
)

debug.noPrint = !config.showDebugMessages

await singleton({ filePath: `${appInstanceName}-pid.txt` })

info(`Starting ${dryRun ? 'dry' : 'normal'} run using ${
 (config.updateIPv4 && config.updateIPv6)
 ? 'both IPv4 and IPv6'
 : (config.updateIPv4 ? 'IPv4' : 'IPv6')
}`)

if (config.updateIPv4) ipv4(dryRun)
if (config.updateIPv6) ipv6(dryRun)

useStorage({ filePath: `${appInstanceName}-log.txt` })
