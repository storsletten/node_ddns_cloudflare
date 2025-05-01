import { networkInterfaces } from 'node:os'

export function getGlobalIPv6() {
 const matches = []
 const interfaces = networkInterfaces()
 for (const name in interfaces) {
  for (const { address, family, internal } of interfaces[name]) {
   if (family === 'IPv6' && !internal && '23'.includes(address[0])) {
    matches.push({ name, address })
    break
   }
  }
 }
 return matches
}

export default getGlobalIPv6
