export const pad0 = (num, len = 2) => String(num).padStart(len, '0')

export const dateString = (d = new Date()) => (
 `${d.getFullYear()}-${pad0(d.getMonth() + 1)}-${pad0(d.getDate())}`
)

export const timeString = (d = new Date()) => (
 `${pad0(d.getHours())}:${pad0(d.getMinutes())}:${pad0(d.getSeconds())}`
)

export const timeMsString = (d = new Date()) => (
 `${timeString(d)}.${pad0(d.getMilliseconds(), 3)}`
)

export const dateTimeString = (d = new Date()) => (
 `${dateString(d)} ${timeString(d)}`
)

export const dateTimeMsString = (d = new Date()) => (
 `${dateString(d)} ${timeMsString(d)}`
)


export default { pad0, dateString, timeString, timeMsString, dateTimeString, dateTimeMsString }
