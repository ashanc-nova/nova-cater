import { tenantConfig } from '../data/tenantConfig'

const prefix = `${tenantConfig.tenantId}:`

export const storageKeys = {
  cart: 'appCart',
  orders: 'appOrders',
  trustedOrderIds: 'trustedOrderIds',
  eventDetails: 'appEventDetails',
  lastCustomerDetails: 'lastCustomerDetails',
  selectedLocationId: 'selectedLocationId',
}

const legacyKeys = {
  [storageKeys.cart]: ['snsAppCart'],
  [storageKeys.orders]: ['snsAppOrders'],
  [storageKeys.trustedOrderIds]: ['snsTrustedOrderIds'],
  [storageKeys.eventDetails]: ['snsAppEventDetails'],
  [storageKeys.lastCustomerDetails]: ['snsLastCustomerDetails'],
  [storageKeys.selectedLocationId]: ['snsSelectedLocationRef'],
}

export function getTenantStorageKey(key) {
  return `${prefix}${key}`
}

export function getStorageValue(key) {
  const namespacedKey = getTenantStorageKey(key)
  const current = localStorage.getItem(namespacedKey)
  if (current !== null) return current

  const match = (legacyKeys[key] || [])
    .map(legacyKey => ({ legacyKey, value: localStorage.getItem(legacyKey) }))
    .find(entry => entry.value !== null)

  if (match) {
    localStorage.setItem(namespacedKey, match.value)
    return match.value
  }

  return null
}

export function setStorageValue(key, value) {
  localStorage.setItem(getTenantStorageKey(key), value)
}

export function removeStorageValue(key) {
  localStorage.removeItem(getTenantStorageKey(key))
}

export function getJSONStorage(key, fallback) {
  const raw = getStorageValue(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function setJSONStorage(key, value) {
  setStorageValue(key, JSON.stringify(value))
}

