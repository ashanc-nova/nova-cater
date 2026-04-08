import { HttpError, isHttpError } from '../http/errors.js'
import { readJsonBody } from '../http/body.js'
import { matchRoute } from '../http/router.js'
import { sendJson, sendNoContent } from '../http/response.js'
import { getAuthContext } from './auth.js'

const buildCorsHeaders = () => ({
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers':
    'Content-Type, Authorization, application-name, businessrefid, restaurantrefid, x-external-api-key, x-external-authorization',
})

const readBearerToken = (value, headerName) => {
  if (!value || !String(value).toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, `Missing ${headerName} bearer token`)
  }
  return String(value).slice(7).trim()
}

const buildRegisteredProfile = (payload, fallback = {}) => ({
  refId: payload?.refId || fallback.refId || '',
  firstName: payload?.firstName || fallback.firstName || '',
  lastName: payload?.lastName || fallback.lastName || '',
  emailAddress: payload?.emailAddress || fallback.emailAddress || '',
  mobileNumber: payload?.mobileNumber || fallback.mobileNumber || '',
  countryCode: payload?.countryCode || fallback.countryCode || '+1',
})

const createRoutes = ({ service, novaClient, authRegistry }) => [
  {
    method: 'POST',
    pattern: '/api/v1/auth/token',
    skipAuth: true,
    handler: async () => novaClient.createAuthToken(),
  },
  {
    method: 'GET',
    pattern: '/external/api/v1/user-session',
    skipAuth: true,
    handler: async ({ headers }) =>
      novaClient.createSession(readBearerToken(headers.authorization, 'Authorization')),
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/mobileVerification',
    skipAuth: true,
    handler: async ({ headers, body }) =>
      novaClient.sendOtp(
        readBearerToken(headers.authorization, 'Authorization'),
        readBearerToken(headers['x-external-authorization'], 'x-external-authorization'),
        body || {},
      ),
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/:verificationId/authenticate',
    skipAuth: true,
    handler: async ({ headers, body, params }) => {
      const authToken = readBearerToken(headers.authorization, 'Authorization')
      const sessionToken = readBearerToken(
        headers['x-external-authorization'],
        'x-external-authorization',
      )
      const response = await novaClient.verifyOtp(
        authToken,
        sessionToken,
        params.verificationId,
        body || {},
      )

      if (!response?.token) {
        return response
      }

      let profile = buildRegisteredProfile(response)
      if (!profile.refId) {
        try {
          const remoteProfile = await novaClient.getProfile(authToken, response.token)
          profile = buildRegisteredProfile(remoteProfile, profile)
        } catch {
          // OTP verification can succeed even if the profile read is unavailable.
        }
      }

      authRegistry.registerUserToken(response.token, profile)
      return {
        ...response,
        ...profile,
      }
    },
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/user-auth',
    skipAuth: true,
    handler: async ({ headers, body }) => {
      const authToken = readBearerToken(headers.authorization, 'Authorization')
      const sessionToken = readBearerToken(
        headers['x-external-authorization'],
        'x-external-authorization',
      )
      const response = await novaClient.loginWithoutOtp(authToken, sessionToken, body || {})
      const profile = buildRegisteredProfile(response, body || {})
      authRegistry.registerUserToken(response.token, profile)
      return {
        ...response,
        ...profile,
      }
    },
  },
  {
    method: 'GET',
    pattern: '/external/api/v1/profile',
    skipAuth: true,
    handler: async ({ headers }) =>
      novaClient.getProfile(
        readBearerToken(headers.authorization, 'Authorization'),
        readBearerToken(headers['x-external-authorization'], 'x-external-authorization'),
      ),
  },
  {
    method: 'GET',
    pattern: '/external/api/v1/catalog/v2/menuitems',
    skipAuth: true,
    handler: async ({ headers }) =>
      novaClient.getMenuItems(
        readBearerToken(headers.authorization, 'Authorization'),
        readBearerToken(headers['x-external-authorization'], 'x-external-authorization'),
        headers.restaurantrefid,
      ),
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/catering/stores/search',
    handler: ({ authContext, body }) => service.searchStores(authContext, body || {}),
  },
  {
    method: 'GET',
    pattern: '/external/api/v1/catering/stores/:restaurantRefId/catalog',
    handler: ({ authContext, params, query }) =>
      service.getCatalog(authContext, params.restaurantRefId, query),
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/catering/cart',
    handler: ({ authContext, body }) => service.createCart(authContext, body || {}),
  },
  {
    method: 'GET',
    pattern: '/external/api/v1/catering/cart/:cartRefId',
    handler: ({ authContext, params }) => service.getCart(authContext, params.cartRefId),
  },
  {
    method: 'PATCH',
    pattern: '/external/api/v1/catering/cart/:cartRefId',
    handler: ({ authContext, params, body }) =>
      service.updateCart(authContext, params.cartRefId, body || {}),
  },
  {
    method: 'DELETE',
    pattern: '/external/api/v1/catering/cart/:cartRefId',
    handler: ({ authContext, params }) => service.deleteCart(authContext, params.cartRefId),
    noContent: true,
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/catering/cart/:cartRefId/validate',
    handler: ({ authContext, params }) => service.validateCart(authContext, params.cartRefId),
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/catering/orders',
    requireUser: true,
    handler: ({ authContext, body }) => service.submitOrder(authContext, body || {}),
  },
  {
    method: 'GET',
    pattern: '/external/api/v1/catering/orders',
    requireUser: true,
    handler: ({ authContext, query }) => service.listOrders(authContext, query),
  },
  {
    method: 'GET',
    pattern: '/external/api/v1/catering/orders/:orderRefId',
    requireUser: true,
    handler: ({ authContext, params }) => service.getOrder(authContext, params.orderRefId),
  },
  {
    method: 'PATCH',
    pattern: '/external/api/v1/catering/orders/:orderRefId',
    requireUser: true,
    handler: ({ authContext, params, body }) =>
      service.updateOrder(authContext, params.orderRefId, body || {}),
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/catering/orders/:orderRefId/cancel',
    requireUser: true,
    handler: ({ authContext, params, body }) =>
      service.cancelOrder(authContext, params.orderRefId, body || {}),
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/catering/orders/:orderRefId/checkout',
    requireUser: true,
    handler: ({ authContext, params }) => service.checkoutOrder(authContext, params.orderRefId),
  },
  {
    method: 'POST',
    pattern: '/external/api/v1/catering/orders/:orderRefId/pay',
    requireUser: true,
    handler: ({ authContext, params, body }) =>
      service.payOrder(authContext, params.orderRefId, body || {}),
  },
]

const parseQuery = (url) => Object.fromEntries(url.searchParams.entries())

export const createCateringController = ({ service, novaClient, authRegistry }) => {
  const routes = createRoutes({ service, novaClient, authRegistry })

  return async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    res._defaultHeaders = buildCorsHeaders()

    if (req.method === 'OPTIONS') {
      sendNoContent(res)
      return
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true, service: 'catering-service' })
      return
    }

    const route = routes.find(
      (candidate) =>
        candidate.method === req.method && matchRoute(url.pathname, candidate.pattern),
    )

    if (!route) {
      sendJson(res, 404, { error: 'Not Found' })
      return
    }

    try {
      const params = matchRoute(url.pathname, route.pattern) || {}
      const body = await readJsonBody(req)
      const authContext = route.skipAuth
        ? null
        : getAuthContext(req.headers, {
            requireUser: route.requireUser,
            authRegistry,
          })
      const result = await route.handler({
        authContext,
        body,
        params,
        headers: req.headers,
        query: parseQuery(url),
      })

      if (route.noContent) {
        sendNoContent(res)
        return
      }

      sendJson(res, 200, result)
    } catch (error) {
      if (isHttpError(error)) {
        sendJson(res, error.statusCode, {
          error: error.message,
          details: error.details,
        })
        return
      }

      console.error('Unhandled catering service error', error)
      const fallback =
        error instanceof HttpError ? error.message : 'Internal Server Error'
      sendJson(res, 500, { error: fallback })
    }
  }
}
