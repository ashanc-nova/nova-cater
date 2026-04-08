import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createAuthToken,
  createCart,
  createSession,
  DEFAULT_STORE_REF_ID,
  fetchCatalog,
  getCart,
  getOrder,
  listOrders,
  loginWithoutOtp,
  normalizeExternalCatalog,
  payOrder as payOrderRequest,
  regenerateCheckout,
  searchStores,
  sendOtpToMobile,
  submitOrder as submitOrderRequest,
  updateCart,
  updateOrder as updateOrderRequest,
  validateCart,
  verifyOtpAndAuthenticate,
  cancelOrder as cancelOrderRequest,
} from '../lib/cateringApi'

const STORAGE_KEYS = {
  auth: 'novaCaterAuth',
  eventDraft: 'novaCaterEventDraft',
  storeRef: 'novaCaterStoreRef',
  cartRef: 'novaCaterCartRef',
}

const DEFAULT_SELECTED_STORE = {
  refId: DEFAULT_STORE_REF_ID,
  name: 'River side',
  aliasName: '7 Leaves Riverside',
  address: '151 N Garfield Ave, Alhambra, California 91801, USA',
  phoneNumber: '2565554494',
}

const CateringContext = createContext(null)

const createInitialEventDraft = () => ({
  eventName: '',
  eventDate: '',
  eventTime: '',
  serviceType: 'delivery',
  deliveryAddress: '',
  guestCount: '',
  specialRequirements: '',
})

const createInitialAuthState = () => ({
  authToken: '',
  sessionToken: '',
  userToken: '',
  profile: null,
})

const formatApiError = (error, fallback) => error?.message || fallback

const mapPaymentOptionToApi = (value) => {
  if (value === 'PAY_FULL' || value === 'PAY_DEPOSIT' || value === 'PAY_LATER') {
    return value
  }

  if (value === 'pay-full') return 'PAY_FULL'
  if (value === 'pay-deposit') return 'PAY_DEPOSIT'
  return 'PAY_LATER'
}

const mapPaymentOptionFromApi = (value) => {
  if (value === 'PAY_FULL') return 'pay-full'
  if (value === 'PAY_DEPOSIT') return 'pay-deposit'
  return 'pay-later'
}

const buildEventDateTime = ({ eventDate, eventTime }) => {
  if (!eventDate || !eventTime) return ''
  return `${eventDate}T${eventTime}`
}

const splitEventDateTime = (eventDateTime) => {
  if (!eventDateTime) {
    return { eventDate: '', eventTime: '' }
  }

  const [eventDate, timePart = ''] = eventDateTime.split('T')
  return {
    eventDate,
    eventTime: timePart.slice(0, 5),
  }
}

const buildProfileFromResponse = (response, fallback = {}) => ({
  refId: response?.refId || fallback.refId || '',
  firstName: response?.firstName || fallback.firstName || '',
  lastName: response?.lastName || fallback.lastName || '',
  emailAddress: response?.emailAddress || fallback.emailAddress || '',
  mobileNumber: response?.mobileNumber || fallback.mobileNumber || '',
  countryCode: response?.countryCode || fallback.countryCode || '+1',
})

const buildExternalCartItem = (item) => ({
  menuItemRefId: item.menuItemRefId || item.refId,
  categoryRefId: item.categoryRefId,
  categoryName: item.categoryName,
  name: item.name,
  description: item.description,
  imageUrl: item.imageUrl,
  currency: item.currency || 'USD',
  unit: item.unit || 'unit',
  serves: item.serves || 1,
  price: Number(item.price || 0),
  quantity: 1,
  specialInstructions: '',
})

const isMatchingCartItem = (entry, itemRefId) =>
  entry.packageRefId === itemRefId || entry.menuItemRefId === itemRefId

export function CateringProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.auth) || 'null') || createInitialAuthState()
    } catch {
      return createInitialAuthState()
    }
  })
  const [eventDraft, setEventDraftState] = useState(() => {
    try {
      return {
        ...createInitialEventDraft(),
        ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.eventDraft) || 'null') || {}),
      }
    } catch {
      return createInitialEventDraft()
    }
  })
  const [selectedStoreRefId, setSelectedStoreRefId] = useState(
    () => localStorage.getItem(STORAGE_KEYS.storeRef) || DEFAULT_STORE_REF_ID,
  )
  const [cartRefId, setCartRefId] = useState(() => localStorage.getItem(STORAGE_KEYS.cartRef) || '')
  const [catalog, setCatalog] = useState({
    categoryList: [],
    raw: null,
    storeDetails: DEFAULT_SELECTED_STORE,
  })
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [storeMatches, setStoreMatches] = useState([])
  const [cart, setCart] = useState(null)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [bootstrapComplete, setBootstrapComplete] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(auth))
  }, [auth])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.eventDraft, JSON.stringify(eventDraft))
  }, [eventDraft])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.storeRef, selectedStoreRefId)
  }, [selectedStoreRefId])

  useEffect(() => {
    if (cartRefId) {
      localStorage.setItem(STORAGE_KEYS.cartRef, cartRefId)
    } else {
      localStorage.removeItem(STORAGE_KEYS.cartRef)
    }
  }, [cartRefId])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        let authToken = auth.authToken
        let sessionToken = auth.sessionToken

        if (!authToken) {
          const tokenResponse = await createAuthToken()
          authToken = tokenResponse.access_token
        }

        if (!sessionToken) {
          const sessionResponse = await createSession({ authToken })
          sessionToken =
            sessionResponse.accessToken ||
            sessionResponse.data?.session_token ||
            ''
        }

        if (cancelled) return
        setAuth((current) => ({
          ...current,
          authToken,
          sessionToken,
        }))
      } catch (error) {
        if (!cancelled) {
          setCatalogError(formatApiError(error, 'Unable to start the catering session.'))
        }
      } finally {
        if (!cancelled) {
          setBootstrapComplete(true)
        }
      }
    }

    if (!bootstrapComplete) {
      bootstrap()
    }

    return () => {
      cancelled = true
    }
  }, [auth.authToken, auth.sessionToken, bootstrapComplete])

  const refreshCatalog = async (restaurantRefId = selectedStoreRefId) => {
    if (!auth.authToken || (!auth.userToken && !auth.sessionToken)) {
      setCatalog((current) => ({
        ...current,
        categoryList: [],
      }))
      return null
    }

    setCatalogLoading(true)
    setCatalogError('')

    try {
      const response = await fetchCatalog({
        authToken: auth.authToken,
        sessionToken: auth.sessionToken,
        userToken: auth.userToken,
        restaurantRefId,
      })
      const normalized = normalizeExternalCatalog(response)
      const nextCatalog = {
        ...normalized,
        storeDetails: catalog?.storeDetails || DEFAULT_SELECTED_STORE,
      }
      setCatalog(nextCatalog)
      return nextCatalog
    } catch (error) {
      setCatalogError(formatApiError(error, 'Unable to load menu items right now.'))
      return null
    } finally {
      setCatalogLoading(false)
    }
  }

  const refreshStoreMatches = async (draft = eventDraft) => {
    if (!auth.sessionToken) {
      return {
        records: [],
        nextStoreRefId: selectedStoreRefId,
      }
    }

    if (!draft.eventDate || !draft.eventTime || !draft.serviceType || !draft.guestCount) {
      setStoreMatches([])
      return {
        records: [],
        nextStoreRefId: selectedStoreRefId,
      }
    }

    if (draft.serviceType === 'delivery' && !draft.deliveryAddress) {
      setStoreMatches([])
      return {
        records: [],
        nextStoreRefId: selectedStoreRefId,
      }
    }

    try {
      const response = await searchStores({
        sessionToken: auth.sessionToken,
        userToken: auth.userToken,
        body: {
          address: draft.deliveryAddress || DEFAULT_SELECTED_STORE.address,
          serviceType: draft.serviceType,
          eventDateTime: buildEventDateTime(draft),
          guestCount: draft.guestCount,
        },
      })
      setStoreMatches(response.records || [])

      const bestMatch =
        response.records?.find((entry) => entry.refId === selectedStoreRefId) ||
        response.records?.find((entry) => entry.eligible && !entry.reviewRequired) ||
        response.records?.[0] ||
        null

      if (bestMatch?.refId && bestMatch.refId !== selectedStoreRefId) {
        setSelectedStoreRefId(bestMatch.refId)
      }

      return {
        records: response.records || [],
        nextStoreRefId: bestMatch?.refId || selectedStoreRefId,
      }
    } catch {
      return {
        records: [],
        nextStoreRefId: selectedStoreRefId,
      }
    }
  }

  const refreshCart = async (
    overrideCartRefId = cartRefId,
    overrideStoreRefId = selectedStoreRefId,
  ) => {
    if (!auth.sessionToken || !overrideCartRefId) {
      return null
    }

    try {
      const nextCart = await getCart({
        sessionToken: auth.sessionToken,
        userToken: auth.userToken,
        restaurantRefId: overrideStoreRefId,
        cartRefId: overrideCartRefId,
      })
      setCart(nextCart)
      setCartError('')
      if (nextCart.restaurantRefId && nextCart.restaurantRefId !== selectedStoreRefId) {
        setSelectedStoreRefId(nextCart.restaurantRefId)
      }
      return nextCart
    } catch (error) {
      setCart(null)
      setCartRefId('')
      setCartError(formatApiError(error, 'Unable to load your cart.'))
      return null
    }
  }

  useEffect(() => {
    if (!auth.authToken || (!auth.userToken && !auth.sessionToken)) return
    refreshCatalog()
  }, [auth.authToken, auth.sessionToken, auth.userToken, selectedStoreRefId])

  useEffect(() => {
    if (!auth.sessionToken || !cartRefId) return
    refreshCart()
  }, [auth.sessionToken, auth.userToken, cartRefId])

  const setEventDraft = (patch) => {
    setEventDraftState((current) => ({ ...current, ...patch }))
  }

  const loadOrderIntoDraft = (order) => {
    const { eventDate, eventTime } = splitEventDateTime(order.eventDetails?.eventDateTime)
    setEventDraftState({
      eventName: order.eventDetails?.eventName || '',
      eventDate,
      eventTime,
      serviceType: order.eventDetails?.serviceType || 'delivery',
      deliveryAddress: order.eventDetails?.deliveryAddress || '',
      guestCount: String(order.eventDetails?.guestCount || ''),
      specialRequirements: order.eventDetails?.specialRequirements || '',
    })
  }

  const finalizeAuth = async (response, fallbackProfile = {}) => {
    const nextAuth = {
      ...auth,
      userToken: response.token,
      profile: buildProfileFromResponse(response, fallbackProfile),
    }

    setAuth(nextAuth)
    return nextAuth
  }

  const ensureLogin = async (profileInput) => {
    if (auth.userToken) return auth

    const response = await loginWithoutOtp({
      authToken: auth.authToken,
      sessionToken: auth.sessionToken,
      profile: profileInput,
    })

    return finalizeAuth(response, profileInput)
  }

  const sendOtpCode = async ({ mobileNumber, countryCode = '+1' }) =>
    sendOtpToMobile({
      authToken: auth.authToken,
      sessionToken: auth.sessionToken,
      mobileNumber,
      countryCode,
    })

  const verifyOtpCode = async ({
    verificationId,
    otp,
    fallbackProfile,
  }) => {
    const response = await verifyOtpAndAuthenticate({
      authToken: auth.authToken,
      sessionToken: auth.sessionToken,
      verificationId,
      otp,
    })

    return finalizeAuth(response, fallbackProfile)
  }

  const logout = () => {
    setAuth((current) => ({
      ...current,
      userToken: '',
      profile: null,
    }))
    setCatalog((current) => ({
      ...current,
      categoryList: [],
    }))
  }

  const buildCartPayload = (
    items,
    draft = eventDraft,
    restaurantRefId = selectedStoreRefId,
  ) => ({
    restaurantRefId,
    serviceType: draft.serviceType,
    eventDateTime: buildEventDateTime(draft),
    deliveryAddress: draft.deliveryAddress,
    guestCount: draft.guestCount,
    specialRequirements: draft.specialRequirements,
    items,
  })

  const mutateCart = async (
    nextItems,
    nextDraft = eventDraft,
    nextStoreRefId = selectedStoreRefId,
  ) => {
    if (!auth.sessionToken) return null
    setCartLoading(true)

    try {
      const payload = buildCartPayload(nextItems, nextDraft, nextStoreRefId)
      const shouldCreateNewCart =
        !cartRefId || (cart?.restaurantRefId && cart.restaurantRefId !== nextStoreRefId)
      const nextCart = cartRefId
        ? shouldCreateNewCart
          ? await createCart({
              sessionToken: auth.sessionToken,
              userToken: auth.userToken,
              restaurantRefId: nextStoreRefId,
              body: payload,
            })
          : await updateCart({
              sessionToken: auth.sessionToken,
              userToken: auth.userToken,
              restaurantRefId: nextStoreRefId,
              cartRefId,
              body: payload,
            })
        : await createCart({
            sessionToken: auth.sessionToken,
            userToken: auth.userToken,
            restaurantRefId: nextStoreRefId,
            body: payload,
          })

      setCart(nextCart)
      setCartRefId(nextCart.refId)
      if (nextCart.restaurantRefId && nextCart.restaurantRefId !== selectedStoreRefId) {
        setSelectedStoreRefId(nextCart.restaurantRefId)
      }
      setCartError('')
      return nextCart
    } catch (error) {
      setCartError(formatApiError(error, 'Unable to update the cart right now.'))
      throw error
    } finally {
      setCartLoading(false)
    }
  }

  const syncCartDraft = async (nextDraft, nextStoreRefId = selectedStoreRefId) => {
    if (!cartRefId) return null
    try {
      return await mutateCart(cart?.itemInputs || [], nextDraft, nextStoreRefId)
    } catch {
      return null
    }
  }

  const addToCart = async (item) => {
    const currentItems = cart?.itemInputs || []
    const matchIndex = currentItems.findIndex((entry) => isMatchingCartItem(entry, item.refId))
    const nextItems =
      matchIndex >= 0
        ? currentItems.map((entry, index) =>
            index === matchIndex ? { ...entry, quantity: entry.quantity + 1 } : entry,
          )
        : [...currentItems, buildExternalCartItem(item)]

    await mutateCart(nextItems)
  }

  const removeFromCart = async (index) => {
    const nextItems = (cart?.itemInputs || []).filter((_, itemIndex) => itemIndex !== index)
    if (nextItems.length === 0 && cartRefId) {
      try {
        const nextCart = await mutateCart(nextItems)
        setCart(nextCart)
      } catch {
        return
      }
      return
    }
    await mutateCart(nextItems)
  }

  const increaseQuantity = async (index) => {
    const nextItems = (cart?.itemInputs || []).map((entry, itemIndex) =>
      itemIndex === index ? { ...entry, quantity: entry.quantity + 1 } : entry,
    )
    await mutateCart(nextItems)
  }

  const decreaseQuantity = async (index) => {
    const currentItems = cart?.itemInputs || []
    const target = currentItems[index]
    if (!target) return
    const nextItems =
      target.quantity > 1
        ? currentItems.map((entry, itemIndex) =>
            itemIndex === index ? { ...entry, quantity: entry.quantity - 1 } : entry,
          )
        : currentItems.filter((_, itemIndex) => itemIndex !== index)
    await mutateCart(nextItems)
  }

  const clearCart = () => {
    setCart(null)
    setCartRefId('')
  }

  const saveDraftAndRefreshCart = async (draft) => {
    setEventDraft(draft)
    const { nextStoreRefId } = await refreshStoreMatches(draft)
    return syncCartDraft(draft, nextStoreRefId)
  }

  const submitOrder = async ({ draft, paymentOption, profileInput }) => {
    const authContext = await ensureLogin(profileInput)
    const finalDraft = { ...eventDraft, ...draft }
    setEventDraftState(finalDraft)

    if (!cartRefId) {
      throw new Error('Your cart is empty.')
    }

    const refreshedCart = await validateCart({
      sessionToken: authContext.sessionToken,
      userToken: authContext.userToken,
      restaurantRefId: selectedStoreRefId,
      cartRefId,
    })

    setCart(refreshedCart)

    let order = await submitOrderRequest({
      sessionToken: authContext.sessionToken,
      userToken: authContext.userToken,
      restaurantRefId: selectedStoreRefId,
      body: {
        cartRefId,
        paymentOption: mapPaymentOptionToApi(paymentOption),
        eventName: finalDraft.eventName,
        eventDateTime: buildEventDateTime(finalDraft),
        serviceType: finalDraft.serviceType,
        deliveryAddress: finalDraft.deliveryAddress,
        guestCount: finalDraft.guestCount,
        specialRequirements: finalDraft.specialRequirements,
      },
    })

    if (
      mapPaymentOptionToApi(paymentOption) !== 'PAY_LATER' &&
      order.orderStatus !== 'REVIEW_REQUIRED'
    ) {
      order = await payOrderRequest({
        sessionToken: authContext.sessionToken,
        userToken: authContext.userToken,
        restaurantRefId: selectedStoreRefId,
        orderRefId: order.orderRefId,
      })
    }

    clearCart()
    return order
  }

  const updateExistingOrder = async ({ orderRefId, draft, paymentOption }) =>
    updateOrderRequest({
      sessionToken: auth.sessionToken,
      userToken: auth.userToken,
      restaurantRefId: selectedStoreRefId,
      orderRefId,
      body: {
        paymentOption: mapPaymentOptionToApi(paymentOption),
        eventName: draft.eventName,
        eventDateTime: buildEventDateTime(draft),
        serviceType: draft.serviceType,
        deliveryAddress: draft.deliveryAddress,
        guestCount: draft.guestCount,
        specialRequirements: draft.specialRequirements,
      },
    })

  const fetchOrders = async (query = { recsPerPage: 20, pageNo: 1 }) => {
    if (!auth.userToken) {
      throw new Error('Please sign in to view your orders.')
    }

    setOrdersLoading(true)
    try {
      return await listOrders({
        sessionToken: auth.sessionToken,
        userToken: auth.userToken,
        restaurantRefId: selectedStoreRefId,
        query,
      })
    } finally {
      setOrdersLoading(false)
    }
  }

  const fetchOrder = async (orderRefId, restaurantRefId = selectedStoreRefId) =>
    getOrder({
      sessionToken: auth.sessionToken,
      userToken: auth.userToken,
      restaurantRefId,
      orderRefId,
    })

  const cancelOrder = async (orderRefId, restaurantRefId, reason) =>
    cancelOrderRequest({
      sessionToken: auth.sessionToken,
      userToken: auth.userToken,
      restaurantRefId,
      orderRefId,
      reason,
    })

  const payOutstandingOrder = async (order) => {
    const checkout = await regenerateCheckout({
      sessionToken: auth.sessionToken,
      userToken: auth.userToken,
      restaurantRefId: order.restaurantRefId,
      orderRefId: order.orderRefId,
    })

    return payOrderRequest({
      sessionToken: auth.sessionToken,
      userToken: auth.userToken,
      restaurantRefId: order.restaurantRefId,
      orderRefId: checkout.orderRefId,
    })
  }

  const cartItems = cart?.menuItems || []
  const cartTotal = cart?.paymentDetails?.grandTotal || 0
  const selectedStore =
    cart?.storeDetails || catalog?.storeDetails || DEFAULT_SELECTED_STORE

  return (
    <CateringContext.Provider
      value={{
        auth,
        bootstrapComplete,
        isAuthenticated: Boolean(auth.userToken),
        eventDraft,
        setEventDraft,
        saveDraftAndRefreshCart,
        loadOrderIntoDraft,
        selectedStoreRefId,
        setSelectedStoreRefId,
        selectedStore,
        catalog,
        catalogLoading,
        catalogError,
        refreshCatalog,
        storeMatches,
        refreshStoreMatches,
        cart,
        cartItems,
        cartRefId,
        cartTotal,
        cartLoading,
        cartError,
        refreshCart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        isInCart: (item) => cartItems.some((entry) => isMatchingCartItem(entry, item.refId)),
        getCartItemIndex: (item) =>
          cartItems.findIndex((entry) => isMatchingCartItem(entry, item.refId)),
        getCartItemQuantity: (item) =>
          cartItems.find((entry) => isMatchingCartItem(entry, item.refId))?.quantity || 0,
        ensureLogin,
        sendOtpCode,
        verifyOtpCode,
        logout,
        submitOrder,
        updateExistingOrder,
        fetchOrders,
        fetchOrder,
        cancelOrder,
        payOutstandingOrder,
        mapPaymentOptionFromApi,
        mapPaymentOptionToApi,
      }}
    >
      {children}
    </CateringContext.Provider>
  )
}

export function useCatering() {
  const value = useContext(CateringContext)
  if (!value) {
    throw new Error('useCatering must be used within CateringProvider')
  }
  return value
}
