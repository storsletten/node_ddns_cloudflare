import { config } from './config.mjs'
import { info, error, debug } from './logger.mjs'
import getGlobalIPv6 from './get_global_ipv6.mjs'
import getDNSRecord from './get_dns_record.mjs'
import updateDNSRecord from './update_dns_record.mjs'

export async function ipv6(dryRun) {
 let globalIP, registeredIP, recordID
 let counter = 0
 while (true) {
  if (counter++) await new Promise(resolve => setTimeout(resolve, config.minPollRateMS))
  try {
   const globalIPs = getGlobalIPv6()
   if (globalIPs.length === 0) throw `Found no global IPv6 addresses on local network interfaces`
   let found
   if (config.interfaceName) {
    found = globalIPs.find(({ name }) => (name === config.interfaceName))
    if (!found) throw `Found no network interface named ${JSON.stringify(config.interfaceName)} with a global IPv6 address assigned`
   }
   else found = globalIPs[(counter - 1) % globalIPs.length]
   globalIP = found.address
   if (globalIP !== registeredIP) debug(`Found global IPv6 address ${globalIP} on network interface "${found.name}"`)
  } catch (err) {
   error(err)
   continue
  }
  if (globalIP !== registeredIP) {
   if (!recordID) {
    try {
     const record = await getDNSRecord({
      type: 'AAAA',
      domain: config.domain,
      apiToken: config.apiToken,
      zoneID: config.zoneID,
     })
     if (record) {
      debug(`Found existing DNS record of type AAAA matching with "${config.domain}" containing the address ${record.content}`)
      recordID = record.id
      registeredIP = record.content
      if (globalIP === registeredIP) {
       info(`DNS record type AAAA for "${config.domain}" is already up-to-date with the address ${registeredIP}`)
       continue
      }
     }
     else debug(`No DNS record of type AAAA matched with "${config.domain}"`)
    } catch (err) {
     error(err)
     continue
    }
   }
   try {
    if (dryRun) {
     info(`Dry run avoided ${recordID ? 'updating' : 'creating'} DNS record of "${config.domain}" with IPv6 address ${globalIP}`)
    } else {
     await updateDNSRecord({
      type: 'AAAA',
      ipAddress: globalIP,
      id: recordID,
      domain: config.domain,
      apiToken: config.apiToken,
      zoneID: config.zoneID,
      ttl: config.ttl,
      proxied: config.proxied,
     })
     info(`${recordID ? 'Updated' : 'Created'} DNS record of "${config.domain}" with IPv6 address ${globalIP}`)
    }
    registeredIP = globalIP
   } catch (err) {
    error(err)
   }
  }
 }
}

export default ipv6
