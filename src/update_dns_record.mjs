import { isIP } from 'node:net'

export async function updateDNSRecord({
 apiToken,
 zoneID,
 ipAddress,
 id,
 domain,
 type,
 ttl = 60,
 proxied = false,
}) {
 if (!apiToken) throw new TypeError(
  `apiToken is missing`
 )
 if (!zoneID) throw new TypeError(
  `zoneID is missing`
 )
 if (!domain) throw new TypeError(
  `domain is missing`
 )
 if (!ipAddress) throw new TypeError(
  `ipAddress is missing`
 )

 const family = isIP(ipAddress)
 if (!family) throw new Error(
  `ipAddress is not valid IPv4 or IPv6`
 )
 if (!type) type = (family === 4 ? 'A' : 'AAAA')

 if (id) {
  const res = await fetch(
   `https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records/${id}`,
   {
    method: 'PUT',
    headers: {
     'Authorization': `Bearer ${apiToken}`,
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, name: domain, content: ipAddress, ttl, proxied }),
   }
  )

  if (!res.ok) throw new Error(
   `Failed to update DNS record: ${res.status} ${res.statusText} - ${await res.text()}`
  )

  return await res.json()
 } else {
  const res = await fetch(
   `https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records`,
   {
    method: 'POST',
    headers: {
     'Authorization': `Bearer ${apiToken}`,
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, name: domain, content: ipAddress, ttl, proxied }),
   }
  )

  if (!res.ok) throw new Error(
   `Failed to create DNS record: ${res.status} ${res.statusText} - ${await res.text()}`
  )

  return await res.json()
 }
}

export default updateDNSRecord
