import { isIP } from 'node:net'

export async function getDNSRecordID({
 apiToken,
 zoneID,
 domain,
 type,
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
 if (!['A', 'AAAA'].includes(type)) throw new TypeError(
  `type must be either A or AAAA`
 )

 const res = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${zoneID}/dns_records?type=${type}&name=${encodeURIComponent(domain)}`,
  {
   headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
   },
  }
 )

 if (!res.ok) throw new Error(
  `Failed to get DNS record type ${type} of ${domain}: ${res.status} ${res.statusText} - ${await res.text()}`
 )

 const jsonRes = await res.json()

 if (!jsonRes.success) throw new Error(
  `Cloudflare returned failure when trying to get DNS record type ${type} of ${domain}: ${JSON.stringify(jsonRes, null, 2)}`
 )

 return jsonRes.result.find(r => (r.name === domain && r.type === type))
}

export default getDNSRecordID
