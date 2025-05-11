import { createSocket } from 'node:dgram'
import { isIP } from 'node:net'

export async function getDescriptionURL(localIP, {
 retries = 0,
 timeout = 3000,
 maxResponseDelay = 1000,
} = {}) {
 if (isIP(localIP) !== 4) throw new Error(
  `localIP must be a valid IPv4 address`
 )
 if (typeof retries !== 'number' || retries % 1 !== 0) throw new TypeError(
  `retries must be a whole number (integer)`
 )
 if (retries < 0) throw new RangeError(
  `retries cannot be less than 0`
 )
 if (typeof timeout !== 'number' || timeout % 1 !== 0) throw new TypeError(
  `timeout must be a whole number (integer)`
 )
 if (timeout <= 1000) throw new RangeError(
  `timeout must be greater than 1000`
 )
 if (typeof maxResponseDelay !== 'number' || maxResponseDelay % 1 !== 0) throw new TypeError(
  `maxResponseDelay must be a whole number (integer)`
 )
 if (maxResponseDelay < 1000) throw new RangeError(
  `maxResponseDelay cannot be less than 1000 ms (1 second) according to UPnP specification (ISO/IEC 29341-3-1)`
 )
 if (timeout <= maxResponseDelay) throw new RangeError(
  `timeout cannot be less than or equal to maxResponseDelay`
 )
 const { promise, resolve, reject } = Promise.withResolvers()
 const ssdpAddress = '239.255.255.250'
 const ssdpPort = 1900
 const requestBody = Buffer.from([
  'M-SEARCH * HTTP/1.1',
  `HOST: ${ssdpAddress}:${ssdpPort}`,
  'MAN: "ssdp:discover"',
  `MX: ${Math.max(1, Math.floor(maxResponseDelay / 1000))}`,
  'ST: urn:schemas-upnp-org:device:InternetGatewayDevice:1',
  'USER-AGENT: DDNS/1.0 UPnP/1.1',
  '',
  '',
 ].join("\r\n"))

 const socket = createSocket({ type: 'udp4', reuseAddr: true })
 let closed = false
 const close = () => {
  closed = true
  clearInterval(timer)
  socket.close()
 }
 const timer = setInterval(() => {
  if (retries > 0) {
   retries--
   socket.send(requestBody, ssdpPort, ssdpAddress)
  }
  else {
   close()
   reject(new Error('Timeout'))
  }
 }, timeout)

 socket.on('error', err => {
  if (closed) return
  close()
  reject(err)
 })

 socket.on('message', (msg, rinfo) => {
  if (closed) return
  const res = msg.toString()
  for (const line of res.split(/\r?\n/)) {
   const i = line.indexOf(':')
   if (i > 0) {
    const key = line.slice(0, i).trim().toLowerCase()
    if (key === 'location') {
     close()
     resolve(new URL(line.slice(i + 1).trim()))
     return
    }
   }
  }
 })

 socket.bind(0, localIP, () => {
  try {
   socket.setBroadcast(true)
   socket.setMulticastTTL(2)
   socket.addMembership(ssdpAddress, localIP)
   socket.setMulticastInterface(localIP)
   socket.send(requestBody, ssdpPort, ssdpAddress)
  } catch (err) {
   close()
   reject(err)
  }
 })

 return promise
}

export default getDescriptionURL
