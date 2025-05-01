import { config } from './config.mjs'
import { info, error, debug } from './logger.mjs'
import getDescriptionURL from './get_description_url.mjs'
import getControlURL from './get_control_url.mjs'
import getRoutableIPv4 from './get_routable_ipv4.mjs'
import getExternalIPv4 from './get_external_ipv4.mjs'
import getDNSRecord from './get_dns_record.mjs'
import updateDNSRecord from './update_dns_record.mjs'

export async function ipv4(dryRun) {
 let descURL, controlURL, routableIP, externalIP, registeredIP, recordID
 let counter = 0
 while (true) {
  if (counter++) await new Promise(resolve => setTimeout(resolve, config.minPollRateMS))
  if (!routableIP) {
   try {
    const routableIPs = getRoutableIPv4()
    if (routableIPs.length === 0) throw `Found no routable IPv4 addresses on local network interfaces`
    let found
    if (config.interfaceName) {
     found = routableIPs.find(({ name }) => (name === config.interfaceName))
     if (!found) throw `Found no network interface named ${JSON.stringify(config.interfaceName)} with a routable IPv4 address assigned`
    }
    else found = routableIPs[(counter - 1) % routableIPs.length]
    routableIP = found.address
    descURL = undefined
    debug(`Found routable IPv4 address ${routableIP} on network interface "${found.name}"`)
   } catch (err) {
    error(err)
    continue
   }
  }
  if (!descURL) {
   try {
    descURL = await getDescriptionURL(routableIP)
    controlURL = undefined
    debug(`Discovered description URL: ${descURL}`)
   } catch (err) {
    error(err)
    routableIP = undefined
    continue
   }
  }
  if (!controlURL) {
   try {
    controlURL = await getControlURL(descURL)
    debug(`Received control URL: ${controlURL}`)
   } catch (err) {
    error(err)
    descURL = undefined
    continue
   }
  }
  try { externalIP = await getExternalIPv4(controlURL) }
  catch (err) {
   error(err)
   routableIP = undefined
   continue
  }
  if (externalIP !== registeredIP) {
   debug(`External IPv4: ${externalIP}`)
   if (!recordID) {
    try {
     const record = await getDNSRecord({
      type: 'A',
      domain: config.domain,
      apiToken: config.apiToken,
      zoneID: config.zoneID,
     })
     if (record) {
      debug(`Found existing DNS record of type A matching with "${config.domain}" containing the address ${record.content}`)
      recordID = record.id
      registeredIP = record.content
      if (externalIP === registeredIP) {
       info(`DNS record type A for "${config.domain}" is already up-to-date with the address ${registeredIP}`)
       continue
      }
     }
     else debug(`No DNS record of type A matched with "${config.domain}"`)
    } catch (err) {
     error(err)
     continue
    }
   }
   try {
    if (dryRun) {
     info(`Dry run avoided ${recordID ? 'updating' : 'creating'} DNS record of "${config.domain}" with IPv4 address ${externalIP}`)
    } else {
     await updateDNSRecord({
      type: 'A',
      ipAddress: externalIP,
      id: recordID,
      domain: config.domain,
      apiToken: config.apiToken,
      zoneID: config.zoneID,
      ttl: config.ttl,
      proxied: config.proxied,
     })
     info(`${recordID ? 'Updated' : 'Created'} DNS record of "${config.domain}" with IPv4 address ${externalIP}`)
    }
    registeredIP = externalIP
   } catch (err) {
    error(err)
   }
  }
 }
}

export default ipv4
