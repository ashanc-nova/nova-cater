import { HttpError } from '../http/errors.js'
import { NOVA_CONFIG } from './config.js'

const buildUrl = (path, query) => {
  const url = new URL(path, NOVA_CONFIG.baseUrl)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

const parseJsonResponse = async (response) => {
  const raw = await response.text()
  const payload = raw ? JSON.parse(raw) : null

  if (!response.ok) {
    throw new HttpError(response.status, payload?.error || payload?.message || 'Nova API request failed', {
      payload,
    })
  }

  return payload
}

export class NovaApiClient {
  buildHeaders({
    authToken,
    sessionToken,
    userToken,
    restaurantRefId = NOVA_CONFIG.restaurantRefId,
    businessRefId = NOVA_CONFIG.businessRefId,
    contentType,
    includeRestaurantRef = false,
  } = {}) {
    const headers = {
      'application-name': NOVA_CONFIG.applicationName,
      businessrefid: businessRefId,
    }

    if (authToken) {
      headers.authorization = `Bearer ${authToken}`
    }

    if (sessionToken || userToken) {
      headers['x-external-authorization'] = `Bearer ${userToken || sessionToken}`
    }

    if (includeRestaurantRef && restaurantRefId) {
      headers.restaurantrefid = restaurantRefId
    }

    if (contentType) {
      headers['content-type'] = contentType
    }

    return headers
  }

  async request(path, { method = 'GET', headers, body, query } = {}) {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    return parseJsonResponse(response)
  }

  createAuthToken() {
    return this.request('/api/v1/auth/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: {
        client_id: NOVA_CONFIG.clientId,
        client_secret: NOVA_CONFIG.clientSecret,
        grant_type: 'client_credentials',
        scope: NOVA_CONFIG.scope,
      },
    })
  }

  createSession(authToken) {
    return this.request('/external/api/v1/user-session', {
      headers: this.buildHeaders({ authToken }),
    })
  }

  sendOtp(authToken, sessionToken, body) {
    return this.request('/external/api/v1/mobileVerification', {
      method: 'POST',
      headers: this.buildHeaders({
        authToken,
        sessionToken,
        contentType: 'application/json',
      }),
      body,
    })
  }

  verifyOtp(authToken, sessionToken, verificationId, body) {
    return this.request(`/external/api/v1/${verificationId}/authenticate`, {
      method: 'POST',
      headers: {
        ...this.buildHeaders({
          authToken,
          sessionToken,
          contentType: 'application/json',
        }),
        businessRefId: NOVA_CONFIG.businessRefId,
      },
      body,
    }).catch((error) => {
      if (error instanceof HttpError && error.statusCode === 404) {
        throw new HttpError(
          404,
          'Invalid or expired verification ID / OTP. Request a fresh OTP and try again.',
          error.details,
        )
      }
      throw error
    })
  }

  loginWithoutOtp(authToken, sessionToken, body) {
    return this.request('/external/api/v1/user-auth', {
      method: 'POST',
      headers: this.buildHeaders({
        authToken,
        sessionToken,
        contentType: 'application/json',
      }),
      body,
    }).catch((error) => {
      if (error instanceof HttpError && error.statusCode === 400) {
        throw new HttpError(
          400,
          'Login without OTP requires a valid first name, last name, and email address.',
          error.details,
        )
      }
      throw error
    })
  }

  getProfile(authToken, userToken) {
    return this.request('/external/api/v1/profile', {
      headers: this.buildHeaders({
        authToken,
        userToken,
      }),
    })
  }

  getMenuItems(authToken, userToken, restaurantRefId = NOVA_CONFIG.restaurantRefId) {
    return this.request('/external/api/v1/catalog/v2/menuitems', {
      headers: this.buildHeaders({
        authToken,
        userToken,
        restaurantRefId,
        includeRestaurantRef: true,
      }),
    })
  }
}
