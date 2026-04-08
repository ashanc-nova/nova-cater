import { createHash, randomUUID } from 'node:crypto'

export const deepClone = (value) => structuredClone(value)

export const createRef = (prefix) => `${prefix}_${randomUUID()}`

export const createNumericOrderId = () => {
  const digits = Date.now().toString().slice(-6)
  return digits.padStart(6, '0')
}

export const toIsoString = (value) => new Date(value).toISOString()

export const addHours = (value, hours) => {
  const date = new Date(value)
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

export const subtractHours = (value, hours) => {
  const date = new Date(value)
  date.setHours(date.getHours() - hours)
  return date.toISOString()
}

export const startOfHour = (value) => {
  const date = new Date(value)
  date.setMinutes(0, 0, 0)
  return date.toISOString()
}

export const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

export const assertArray = (value) => Array.isArray(value) ? value : []

export const toEnumValue = (value) => typeof value === 'string' ? value.trim().toUpperCase() : ''

export const hashToken = (token) => createHash('sha256').update(token).digest('hex').slice(0, 12)

export const normalizeString = (value) => typeof value === 'string' ? value.trim() : ''

export const normalizeAddress = (value) => normalizeString(value).toLowerCase()

export const includesAny = (value, terms) => {
  const haystack = normalizeAddress(value)
  return terms.some((term) => haystack.includes(term.toLowerCase()))
}
