import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import test from 'node:test'
import { createCateringRuntime } from '../app.js'
import { createCateringController } from '../catering/controller.js'

const businessRefId = '42d4a7e1-661a-4e72-a822-27112f8e0128'
const apiKey = 'test-api-key'
const sessionToken = 'session_demo_token'
const userToken = 'user_demo_token'
const restaurantRefId = '89e21218-a8c2-46f4-ab92-9746b26ccd4b'

const futureIso = (hoursFromNow) => new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString()

const buildHeaders = ({ user = false, restaurantRefId = '' } = {}) => {
  const headers = {
    authorization: `Bearer ${sessionToken}`,
    'application-name': 'Catering.App',
    businessrefid: businessRefId,
    'x-external-api-key': apiKey,
    'x-external-authorization': `Bearer ${user ? userToken : sessionToken}`,
  }

  if (restaurantRefId) {
    headers.restaurantrefid = restaurantRefId
  }

  return headers
}

const defaultCartItems = [
  { packageRefId: 'pkg_original_double_platter', quantity: 1 },
  { packageRefId: 'pkg_mixed_sandwich_platter', quantity: 1 },
  { packageRefId: 'pkg_coke_package', quantity: 1 },
]

const startTestServer = async () => {
  const runtime = createCateringRuntime()
  const handler = createCateringController(runtime)

  const request = async (path, { method = 'GET', body, user = false, headers = {} } = {}) => {
    const mergedHeaders = {
      ...buildHeaders({ user, restaurantRefId: headers.restaurantrefid || '' }),
      ...headers,
    }

    if (body !== undefined) {
      mergedHeaders['content-type'] = 'application/json'
    }

    const bodyText = body !== undefined ? JSON.stringify(body) : ''
    const req = Readable.from(bodyText ? [bodyText] : [])
    req.method = method
    req.url = path
    req.headers = mergedHeaders

    const response = await new Promise((resolve, reject) => {
      const chunks = []
      let statusCode = 200
      let responseHeaders = {}

      const res = {
        writeHead(code, outgoingHeaders = {}) {
          statusCode = code
          responseHeaders = outgoingHeaders
        },
        end(chunk = '') {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
          }

          resolve({
            status: statusCode,
            headers: responseHeaders,
            raw: Buffer.concat(chunks).toString('utf8'),
          })
        },
      }

      Promise.resolve(handler(req, res)).catch(reject)
    })

    return {
      status: response.status,
      body: response.raw ? JSON.parse(response.raw) : null,
    }
  }

  return {
    runtime,
    request,
  }
}

const createCart = async (request, overrides = {}) => {
  const body = {
    restaurantRefId,
    serviceType: 'delivery',
    eventDateTime: futureIso(40),
    deliveryAddress: '2410 San Ramon Valley Blvd Ste 150, San Ramon, CA 94583',
    guestCount: 35,
    specialRequirements: '',
    items: defaultCartItems,
    ...overrides,
  }

  const response = await request('/external/api/v1/catering/cart', {
    method: 'POST',
    body,
    headers: { restaurantrefid: body.restaurantRefId },
  })

  assert.equal(response.status, 200)
  return response.body
}

test('store search and catalog expose store-first catering data', async () => {
  const ctx = await startTestServer()
  const eventDateTime = futureIso(30)
  const search = await ctx.request('/external/api/v1/catering/stores/search', {
    method: 'POST',
    body: {
      address: '2410 San Ramon Valley Blvd Ste 150, San Ramon, CA 94583',
      serviceType: 'delivery',
      eventDateTime,
      guestCount: 40,
    },
  })

  assert.equal(search.status, 200)
  assert.equal(search.body.summary.totalStores, 2)

  const sanRamon = search.body.records.find((entry) => entry.refId === restaurantRefId)
  assert.ok(sanRamon)
  assert.equal(sanRamon.reviewRequired, false)

  const catalog = await ctx.request(
    `/external/api/v1/catering/stores/${restaurantRefId}/catalog?eventDateTime=${encodeURIComponent(eventDateTime)}&serviceType=delivery&guestCount=40&address=${encodeURIComponent('2410 San Ramon Valley Blvd Ste 150, San Ramon, CA 94583')}`,
    {
      headers: { restaurantrefid: restaurantRefId },
    },
  )

  assert.equal(catalog.status, 200)
  assert.equal(catalog.body.categoryList.length, 5)
  assert.ok(catalog.body.categoryList[0].packages.length > 0)
})

test('cart creation and validation compute totals, lockAt, and deposit preview server-side', async () => {
  const ctx = await startTestServer()
  const cart = await createCart(ctx.request)
  assert.equal(cart.validation.isValid, true)
  assert.equal(cart.validation.reviewRequired, false)
  assert.ok(cart.lockAt)
  assert.ok(cart.depositDetails.depositAmount > 0)
  assert.ok(cart.paymentDetails.grandTotal > cart.paymentDetails.subTotal)

  const validated = await ctx.request(`/external/api/v1/catering/cart/${cart.refId}/validate`, {
    method: 'POST',
    headers: { restaurantrefid: restaurantRefId },
  })

  assert.equal(validated.status, 200)
  assert.equal(validated.body.refId, cart.refId)
  assert.equal(validated.body.validation.reviewRequired, false)
})

test('review-required orders are created without capturing payment', async () => {
  const ctx = await startTestServer()
  const cart = await createCart(ctx.request, {
    specialRequirements: 'Need custom onsite chef station and negotiated service',
  })

  const submit = await ctx.request('/external/api/v1/catering/orders', {
    method: 'POST',
    user: true,
    headers: { restaurantrefid: restaurantRefId },
    body: {
      cartRefId: cart.refId,
      paymentOption: 'PAY_FULL',
      eventName: 'Leadership Offsite',
      eventDateTime: cart.eventDetails.eventDateTime,
      serviceType: cart.eventDetails.serviceType,
      deliveryAddress: cart.eventDetails.deliveryAddress,
      guestCount: cart.eventDetails.guestCount,
      specialRequirements: cart.eventDetails.specialRequirements,
    },
  })

  assert.equal(submit.status, 200)
  assert.equal(submit.body.orderStatus, 'REVIEW_REQUIRED')
  assert.equal(submit.body.orderPaymentStatus, 'UNPAID')
  assert.equal(submit.body.checkout, null)
  assert.equal(submit.body.validation.reviewRequired, true)
})

test('pay-later orders auto-confirm and show up in authenticated order history', async () => {
  const ctx = await startTestServer()
  const guestHistory = await ctx.request('/external/api/v1/catering/orders')
  assert.equal(guestHistory.status, 401)

  const cart = await createCart(ctx.request)
  const submit = await ctx.request('/external/api/v1/catering/orders', {
    method: 'POST',
    user: true,
    headers: { restaurantrefid: restaurantRefId },
    body: {
      cartRefId: cart.refId,
      paymentOption: 'PAY_LATER',
      eventName: 'Board Lunch',
      eventDateTime: cart.eventDetails.eventDateTime,
      serviceType: cart.eventDetails.serviceType,
      deliveryAddress: cart.eventDetails.deliveryAddress,
      guestCount: cart.eventDetails.guestCount,
    },
  })

  assert.equal(submit.status, 200)
  assert.equal(submit.body.orderStatus, 'CONFIRMED')
  assert.equal(submit.body.orderPaymentStatus, 'UNPAID')

  const history = await ctx.request('/external/api/v1/catering/orders?recsPerPage=20&pageNo=1', {
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
  })

  assert.equal(history.status, 200)
  assert.equal(history.body.records.length, 1)
  assert.equal(history.body.summary.openOrdersCount, 1)

  const detail = await ctx.request(`/external/api/v1/catering/orders/${submit.body.orderRefId}`, {
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
  })

  assert.equal(detail.status, 200)
  assert.equal(detail.body.orderRefId, submit.body.orderRefId)
  assert.equal(detail.body.events.length, 1)
  assert.equal(detail.body.events[0].type, 'ORDER_CREATED')
})

test('deposit and full-payment orders support checkout retry and idempotent payment confirmation', async () => {
  const ctx = await startTestServer()
  const depositCart = await createCart(ctx.request)
  const depositOrder = await ctx.request('/external/api/v1/catering/orders', {
    method: 'POST',
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
    body: {
      cartRefId: depositCart.refId,
      paymentOption: 'PAY_DEPOSIT',
      eventName: 'Launch Party',
      eventDateTime: depositCart.eventDetails.eventDateTime,
      serviceType: depositCart.eventDetails.serviceType,
      deliveryAddress: depositCart.eventDetails.deliveryAddress,
      guestCount: depositCart.eventDetails.guestCount,
    },
  })

  assert.equal(depositOrder.status, 200)
  assert.equal(depositOrder.body.orderStatus, 'PENDING_PAYMENT')
  assert.equal(depositOrder.body.orderPaymentStatus, 'DEPOSIT_PENDING')
  assert.ok(depositOrder.body.checkout.url)

  const retryCheckout = await ctx.request(`/external/api/v1/catering/orders/${depositOrder.body.orderRefId}/checkout`, {
    method: 'POST',
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
  })

  assert.equal(retryCheckout.status, 200)
  assert.ok(retryCheckout.body.checkout.url)

  const afterDeposit = ctx.runtime.service.confirmPayment({
    orderRefId: depositOrder.body.orderRefId,
    amount: depositOrder.body.depositDetails.depositAmount,
    paymentReference: 'payment_ref_deposit_1',
    idempotencyKey: 'event_deposit_1',
  })

  assert.equal(afterDeposit.orderStatus, 'CONFIRMED')
  assert.equal(afterDeposit.orderPaymentStatus, 'PARTIALLY_PAID')
  assert.equal(afterDeposit.paymentDetails.amountPaid, depositOrder.body.depositDetails.depositAmount)

  const idempotentReplay = ctx.runtime.service.confirmPayment({
    orderRefId: depositOrder.body.orderRefId,
    amount: depositOrder.body.depositDetails.depositAmount,
    paymentReference: 'payment_ref_deposit_1',
    idempotencyKey: 'event_deposit_1',
  })

  assert.equal(idempotentReplay.paymentDetails.amountPaid, afterDeposit.paymentDetails.amountPaid)

  const fullCart = await createCart(ctx.request, {
    serviceType: 'pickup',
    deliveryAddress: '',
  })
  const fullOrder = await ctx.request('/external/api/v1/catering/orders', {
    method: 'POST',
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
    body: {
      cartRefId: fullCart.refId,
      paymentOption: 'PAY_FULL',
      eventName: 'Training Day',
      eventDateTime: fullCart.eventDetails.eventDateTime,
      serviceType: fullCart.eventDetails.serviceType,
      guestCount: fullCart.eventDetails.guestCount,
    },
  })

  assert.equal(fullOrder.status, 200)
  assert.equal(fullOrder.body.orderStatus, 'PENDING_PAYMENT')

  const afterFullPayment = ctx.runtime.service.confirmPayment({
    orderRefId: fullOrder.body.orderRefId,
    amount: fullOrder.body.paymentDetails.grandTotal,
    paymentReference: 'payment_ref_full_1',
    idempotencyKey: 'event_full_1',
  })

  assert.equal(afterFullPayment.orderStatus, 'CONFIRMED')
  assert.equal(afterFullPayment.orderPaymentStatus, 'PAID')
  assert.equal(afterFullPayment.paymentDetails.remainingAmount, 0)
})

test('orders can be modified before lock, reject modification after lock, and cancel before cutoff', async () => {
  const ctx = await startTestServer()
  const orderCart = await createCart(ctx.request)
  const orderResponse = await ctx.request('/external/api/v1/catering/orders', {
    method: 'POST',
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
    body: {
      cartRefId: orderCart.refId,
      paymentOption: 'PAY_LATER',
      eventName: 'All Hands',
      eventDateTime: orderCart.eventDetails.eventDateTime,
      serviceType: orderCart.eventDetails.serviceType,
      deliveryAddress: orderCart.eventDetails.deliveryAddress,
      guestCount: orderCart.eventDetails.guestCount,
    },
  })

  assert.equal(orderResponse.status, 200)

  const updated = await ctx.request(`/external/api/v1/catering/orders/${orderResponse.body.orderRefId}`, {
    method: 'PATCH',
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
    body: {
      guestCount: 50,
      specialRequirements: 'Need vegan labels only',
    },
  })

  assert.equal(updated.status, 200)
  assert.equal(updated.body.eventDetails.guestCount, 50)
  assert.equal(updated.body.eventDetails.specialRequirements, 'Need vegan labels only')

  const lockedOrder = ctx.runtime.repository.getOrder(orderResponse.body.orderRefId)
  ctx.runtime.repository.saveOrder({
    ...lockedOrder,
    lockAt: new Date(Date.now() - 60_000).toISOString(),
  })

  const rejectedUpdate = await ctx.request(`/external/api/v1/catering/orders/${orderResponse.body.orderRefId}`, {
    method: 'PATCH',
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
    body: {
      guestCount: 55,
    },
  })

  assert.equal(rejectedUpdate.status, 409)

  const cancelCart = await createCart(ctx.request, {
    eventDateTime: futureIso(60),
  })
  const cancellableOrder = await ctx.request('/external/api/v1/catering/orders', {
    method: 'POST',
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
    body: {
      cartRefId: cancelCart.refId,
      paymentOption: 'PAY_LATER',
      eventName: 'Town Hall',
      eventDateTime: cancelCart.eventDetails.eventDateTime,
      serviceType: cancelCart.eventDetails.serviceType,
      deliveryAddress: cancelCart.eventDetails.deliveryAddress,
      guestCount: cancelCart.eventDetails.guestCount,
    },
  })

  const cancelled = await ctx.request(`/external/api/v1/catering/orders/${cancellableOrder.body.orderRefId}/cancel`, {
    method: 'POST',
    user: true,
    headers: { restaurantrefid: '89e21218-a8c2-46f4-ab92-9746b26ccd4b' },
    body: { reason: 'Event moved online' },
  })

  assert.equal(cancelled.status, 200)
  assert.equal(cancelled.body.orderStatus, 'CANCELLED')
  assert.equal(cancelled.body.cancellationReason, 'Event moved online')
})
