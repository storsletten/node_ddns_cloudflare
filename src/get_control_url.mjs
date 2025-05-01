export async function getControlURL(descURL) {
 if (![String, URL].includes(descURL?.constructor)) throw new TypeError(
  `descURL must be either a string or a URL object`
 )
 const res = await fetch(descURL, { method: 'GET' })

 if (!res.ok) throw new Error(
  `HTTP error ${res.status} when fetching device description`
 )

 const text = await res.text()
 const match = text.match(/<controlURL>(.+?)<\/controlURL>/)
 if (!match) throw new Error(
  `No control URL found in device description`
 )
 return new URL(match[1].trim(), descURL)
}

export default getControlURL
