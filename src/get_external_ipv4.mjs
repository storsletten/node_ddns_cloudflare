import { isIP } from 'node:net'

export async function getExternalIP(controlURL) {
 if (![String, URL].includes(controlURL?.constructor)) throw new TypeError(
  `controlURL must be either a string or a URL object`
 )
 const soapBody = `
<?xml version="1.0"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
 <s:Body>
  <u:GetExternalIPAddress xmlns:u="urn:schemas-upnp-org:service:WANIPConnection:1" />
 </s:Body>
</s:Envelope>`

 const res = await fetch(controlURL, {
  method: 'POST',
  headers: {
   'Content-Type': 'text/xml; charset="utf-8"',
   'SOAPAction': '"urn:schemas-upnp-org:service:WANIPConnection:1#GetExternalIPAddress"'
  },
  body: soapBody
 })

 if (!res.ok) throw new Error(
  `HTTP error ${res.status} when requesting external IP`
 )

 const text = await res.text()
 const match = text.match(/<NewExternalIPAddress>(.+?)<\/NewExternalIPAddress>/)
 if (!match) throw new Error(
  `External IP address not found in SOAP response`
 )
 const ip = match[1].trim()
 if (isIP(ip) !== 4) throw new Error(
  `The returned IP is not a valid IPv4 address: ${ip}`
 )
 return ip
}

export default getExternalIP
