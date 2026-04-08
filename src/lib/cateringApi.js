const isLocalDevHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalDevHost ? '' : '')

export const BUSINESS_REF_ID =
  '42d4a7e1-661a-4e72-a822-27112f8e0128'
export const CATERING_APPLICATION_NAME = 'Catering.App'
export const EXTERNAL_APPLICATION_NAME = 'TakeAway.App'
export const API_KEY = 'nova-cater-web'
export const DEFAULT_STORE_REF_ID =
  '89e21218-a8c2-46f4-ab92-9746b26ccd4b'

const buildUrl = (path, query) => {
  const url = new URL(path, API_BASE_URL || window.location.origin)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

const parseResponse = async (response) => {
  const raw = await response.text()
  const payload = raw ? JSON.parse(raw) : null

  if (!response.ok) {
    const message =
      payload?.error || payload?.message || `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.details = payload?.details || null
    throw error
  }

  return payload
}

const buildHeaders = ({
  applicationName = CATERING_APPLICATION_NAME,
  authToken,
  sessionToken,
  userToken,
  restaurantRefId,
  includeJson = false,
} = {}) => {
  const headers = {
    'application-name': applicationName,
    businessrefid: BUSINESS_REF_ID,
    'x-external-api-key': API_KEY,
  }

  if (includeJson) {
    headers['content-type'] = 'application/json'
  }

  if (authToken) {
    headers.authorization = `Bearer ${authToken}`
  } else if (sessionToken) {
    headers.authorization = `Bearer ${sessionToken}`
  }

  if (sessionToken || userToken) {
    headers['x-external-authorization'] = `Bearer ${userToken || sessionToken}`
  }

  if (restaurantRefId) {
    headers.restaurantrefid = restaurantRefId
  }

  return headers
}

const request = async (
  path,
  {
    method = 'GET',
    applicationName = CATERING_APPLICATION_NAME,
    authToken,
    sessionToken,
    userToken,
    restaurantRefId,
    body,
    query,
  } = {},
) => {
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: buildHeaders({
      applicationName,
      authToken,
      sessionToken,
      userToken,
      restaurantRefId,
      includeJson: body !== undefined,
    }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  return parseResponse(response)
}

const sanitizeDescription = (value = '') =>
  String(value).replace(/^"+|"+$/g, '').trim()

const resolveMenuItems = (category) => {
  if (Array.isArray(category.menuItems)) return category.menuItems
  if (Array.isArray(category.menuItemList)) return category.menuItemList
  if (Array.isArray(category.menus)) return category.menus

  if (Array.isArray(category.subCategories)) {
    return category.subCategories.flatMap((subCategory) => {
      if (Array.isArray(subCategory.menuItems)) return subCategory.menuItems
      if (Array.isArray(subCategory.menuItemList)) return subCategory.menuItemList
      return []
    })
  }

  return []
}

export const normalizeExternalCatalog = (payload = {}) => ({
  categoryList: (payload.categoryList || [])
    .filter((category) => category?.isPublished !== false)
    .map((category, categoryIndex) => ({
      refId: category.refId,
      name: category.name,
      displayOrder:
        Number.isFinite(category.displayOrder) ? category.displayOrder : categoryIndex,
      packages: resolveMenuItems(category)
        .filter((item) => item?.isPublished !== false && item?.outOfStock !== true)
        .map((item) => ({
          refId: item.refId || item.menuItemRefId,
          menuItemRefId: item.refId || item.menuItemRefId,
          categoryRefId: item.categoryRefId || category.refId,
          categoryName: item.categoryName || category.name,
          name: item.aliasNames?.onlineName || item.name || 'Menu Item',
          description: sanitizeDescription(item.description),
          price: Number(item.price || item.originalPrice || 0),
          currency: item.currency || 'USD',
          serves: 1,
          unit:
            item.measurement?.type ||
            item.measurementType ||
            'unit',
          imageUrl:
            item.imageUrl ||
            item.images?.original?.url ||
            item.images?.large?.url ||
            item.images?.squared?.url ||
            '',
          availabilitySettings: item.availabilitySettings || [],
          modifierTypes: item.modifierTypes || [],
          raw: item,
        })),
    })),
  raw: payload,
})

export const createAuthToken = async () =>
  request('/api/v1/auth/token', {
    method: 'POST',
    applicationName: EXTERNAL_APPLICATION_NAME,
  })

export const createSession = async ({ authToken }) =>
  request('/external/api/v1/user-session', {
    applicationName: EXTERNAL_APPLICATION_NAME,
    authToken,
  })

export const sendOtpToMobile = async ({ authToken, sessionToken, mobileNumber, countryCode }) =>
  request('/external/api/v1/mobileVerification', {
    method: 'POST',
    applicationName: EXTERNAL_APPLICATION_NAME,
    authToken,
    sessionToken,
    body: {
      mobileNumber,
      countryCode,
    },
  })

export const verifyOtpAndAuthenticate = async ({
  authToken,
  sessionToken,
  verificationId,
  otp,
}) =>
  request(`/external/api/v1/${verificationId}/authenticate`, {
    method: 'POST',
    applicationName: EXTERNAL_APPLICATION_NAME,
    authToken,
    sessionToken,
    body: { otp },
  })

export const loginWithoutOtp = async ({ authToken, sessionToken, profile }) =>
  request('/external/api/v1/user-auth', {
    method: 'POST',
    applicationName: EXTERNAL_APPLICATION_NAME,
    authToken,
    sessionToken,
    body: {
      countryCode: profile.countryCode || '+1',
      mobileNumber: profile.mobileNumber,
      firstName: profile.firstName,
      lastName: profile.lastName,
      emailAddress: profile.emailAddress || '',
    },
  })

export const getProfile = async ({ authToken, userToken }) =>
  request('/external/api/v1/profile', {
    applicationName: EXTERNAL_APPLICATION_NAME,
    authToken,
    userToken,
  })

export const fetchCatalog = async ({ authToken, sessionToken, userToken, restaurantRefId }) =>
  request('/external/api/v1/catalog/v2/menuitems', {
    applicationName: EXTERNAL_APPLICATION_NAME,
    authToken,
    sessionToken,
    userToken,
    restaurantRefId,
  })

export const searchStores = async ({ sessionToken, userToken, body }) =>
  request('/external/api/v1/catering/stores/search', {
    method: 'POST',
    sessionToken,
    userToken,
    body,
  })

export const createCart = async ({ sessionToken, userToken, restaurantRefId, body }) =>
  request('/external/api/v1/catering/cart', {
    method: 'POST',
    sessionToken,
    userToken,
    restaurantRefId,
    body,
  })

export const getCart = async ({ sessionToken, userToken, restaurantRefId, cartRefId }) =>
  request(`/external/api/v1/catering/cart/${cartRefId}`, {
    sessionToken,
    userToken,
    restaurantRefId,
  })

export const updateCart = async ({
  sessionToken,
  userToken,
  restaurantRefId,
  cartRefId,
  body,
}) =>
  request(`/external/api/v1/catering/cart/${cartRefId}`, {
    method: 'PATCH',
    sessionToken,
    userToken,
    restaurantRefId,
    body,
  })

export const validateCart = async ({ sessionToken, userToken, restaurantRefId, cartRefId }) =>
  request(`/external/api/v1/catering/cart/${cartRefId}/validate`, {
    method: 'POST',
    sessionToken,
    userToken,
    restaurantRefId,
  })

export const submitOrder = async ({ sessionToken, userToken, restaurantRefId, body }) =>
  request('/external/api/v1/catering/orders', {
    method: 'POST',
    sessionToken,
    userToken,
    restaurantRefId,
    body,
  })

export const listOrders = async ({ sessionToken, userToken, restaurantRefId, query }) =>
  request('/external/api/v1/catering/orders', {
    sessionToken,
    userToken,
    restaurantRefId,
    query,
  })

export const getOrder = async ({ sessionToken, userToken, restaurantRefId, orderRefId }) =>
  request(`/external/api/v1/catering/orders/${orderRefId}`, {
    sessionToken,
    userToken,
    restaurantRefId,
  })

export const updateOrder = async ({
  sessionToken,
  userToken,
  restaurantRefId,
  orderRefId,
  body,
}) =>
  request(`/external/api/v1/catering/orders/${orderRefId}`, {
    method: 'PATCH',
    sessionToken,
    userToken,
    restaurantRefId,
    body,
  })

export const cancelOrder = async ({
  sessionToken,
  userToken,
  restaurantRefId,
  orderRefId,
  reason,
}) =>
  request(`/external/api/v1/catering/orders/${orderRefId}/cancel`, {
    method: 'POST',
    sessionToken,
    userToken,
    restaurantRefId,
    body: { reason },
  })

export const regenerateCheckout = async ({
  sessionToken,
  userToken,
  restaurantRefId,
  orderRefId,
}) =>
  request(`/external/api/v1/catering/orders/${orderRefId}/checkout`, {
    method: 'POST',
    sessionToken,
    userToken,
    restaurantRefId,
  })

export const payOrder = async ({ sessionToken, userToken, restaurantRefId, orderRefId, amount }) =>
  request(`/external/api/v1/catering/orders/${orderRefId}/pay`, {
    method: 'POST',
    sessionToken,
    userToken,
    restaurantRefId,
    body: amount ? { amount } : {},
  })
