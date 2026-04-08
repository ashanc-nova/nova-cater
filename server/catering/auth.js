import { HttpError } from '../http/errors.js'
import { APPLICATION_NAME } from './constants.js'
import { hashToken, normalizeString } from './utils.js'

const readBearerToken = (value, headerName) => {
  const normalized = normalizeString(value)
  if (!normalized) {
    throw new HttpError(401, `Missing ${headerName} header`)
  }

  if (!normalized.toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, `${headerName} must use Bearer authentication`)
  }

  const token = normalized.slice(7).trim()
  if (!token) {
    throw new HttpError(401, `${headerName} token is empty`)
  }
  return token
}

const deriveUserProfile = (userToken) => {
  const fingerprint = hashToken(userToken)
  return {
    refId: `user_${fingerprint}`,
    firstName: 'Catering',
    lastName: `User-${fingerprint.slice(0, 4)}`,
    emailAddress: `${fingerprint}@catering.local`,
    mobileNumber: fingerprint.slice(0, 10),
    countryCode: '+1',
  }
}

export const getAuthContext = (headers, { requireUser = false, authRegistry = null } = {}) => {
  const applicationName = normalizeString(headers['application-name'])
  if (applicationName !== APPLICATION_NAME) {
    throw new HttpError(400, `application-name must be ${APPLICATION_NAME}`)
  }

  const apiKey = normalizeString(headers['x-external-api-key'])
  const businessRefId = normalizeString(headers.businessrefid)

  if (!businessRefId) {
    throw new HttpError(400, 'Missing businessrefid header')
  }

  const sessionToken = readBearerToken(headers.authorization, 'Authorization')
  const externalToken = readBearerToken(headers['x-external-authorization'], 'x-external-authorization')
  const restaurantRefId = normalizeString(headers.restaurantrefid)
  const isUserAuthenticated = externalToken !== sessionToken

  if (requireUser && !isUserAuthenticated) {
    throw new HttpError(401, 'This endpoint requires an authenticated user token')
  }

  const profile = isUserAuthenticated
    ? authRegistry?.getUserProfile(externalToken) || deriveUserProfile(externalToken)
    : null

  return {
    applicationName,
    apiKey,
    businessRefId,
    restaurantRefId,
    sessionToken,
    userToken: isUserAuthenticated ? externalToken : null,
    sessionRefId: `session_${hashToken(sessionToken)}`,
    isUserAuthenticated,
    userProfile: profile,
  }
}

export const assertOrderOwnership = (order, authContext) => {
  if (!authContext.isUserAuthenticated || !authContext.userProfile) {
    throw new HttpError(401, 'This endpoint requires an authenticated user token')
  }

  if (order.customerDetails?.userRefId !== authContext.userProfile.refId) {
    throw new HttpError(403, 'You are not authorized to access this order')
  }
}
