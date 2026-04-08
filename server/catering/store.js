import { deepClone } from './utils.js'

export class InMemoryCateringStore {
  constructor(seedData) {
    this.state = {
      seed: deepClone(seedData),
      carts: new Map(),
      orders: new Map(),
      orderEvents: new Map(),
      processedPayments: new Map(),
    }
  }

  getBusinessRefId() {
    return this.state.seed.businessRefId
  }

  listStores() {
    return deepClone(this.state.seed.stores)
  }

  getStoreByRefId(refId) {
    const store = this.state.seed.stores.find((entry) => entry.refId === refId)
    return store ? deepClone(store) : null
  }

  listCategories() {
    return deepClone(this.state.seed.categories)
  }

  listPackages() {
    return deepClone(this.state.seed.packages)
  }

  getPackageByRefId(refId) {
    const item = this.state.seed.packages.find((entry) => entry.refId === refId)
    return item ? deepClone(item) : null
  }

  saveCart(cart) {
    this.state.carts.set(cart.refId, deepClone(cart))
    return deepClone(cart)
  }

  getCart(refId) {
    const cart = this.state.carts.get(refId)
    return cart ? deepClone(cart) : null
  }

  deleteCart(refId) {
    return this.state.carts.delete(refId)
  }

  saveOrder(order) {
    this.state.orders.set(order.orderRefId, deepClone(order))
    return deepClone(order)
  }

  getOrder(orderRefId) {
    const order = this.state.orders.get(orderRefId)
    return order ? deepClone(order) : null
  }

  listOrders() {
    return Array.from(this.state.orders.values()).map((order) => deepClone(order))
  }

  appendOrderEvent(orderRefId, event) {
    const current = this.state.orderEvents.get(orderRefId) || []
    current.push(deepClone(event))
    this.state.orderEvents.set(orderRefId, current)
    return deepClone(current)
  }

  listOrderEvents(orderRefId) {
    return deepClone(this.state.orderEvents.get(orderRefId) || [])
  }

  hasProcessedPayment(idempotencyKey) {
    return this.state.processedPayments.has(idempotencyKey)
  }

  markPaymentProcessed(idempotencyKey, payload) {
    this.state.processedPayments.set(idempotencyKey, deepClone(payload))
  }

  getProcessedPayment(idempotencyKey) {
    const value = this.state.processedPayments.get(idempotencyKey)
    return value ? deepClone(value) : null
  }
}
