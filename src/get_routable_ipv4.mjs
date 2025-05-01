import { networkInterfaces } from 'node:os'

export function getRoutableIPv4() {
 const matches = []
 const interfaces = networkInterfaces()
 for (const name in interfaces) {
  for (const { address, family, internal } of interfaces[name]) {
   if (family === 'IPv4' && !internal && !address.startsWith('169.254.')) {
    matches.push({ name, address })
    break
   }
  }
 }
 return matches
}

export default getRoutableIPv4
