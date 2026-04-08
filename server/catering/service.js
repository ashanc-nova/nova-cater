import { HttpError } from '../http/errors.js'
import { assertOrderOwnership } from './auth.js'
import { PAYMENT_OPTIONS, PAYMENT_STATUSES, ORDER_STATUSES, REVIEW_FLAG_TYPES, SERVICE_TYPE_TO_ORDER_TYPE, TERMINAL_ORDER_STATUSES } from './constants.js'
import { buildOmsPayload } from './fulfillmentAdapter.js'
import { applyPaymentToDetails, calculateDepositDetails, calculateTotals } from './pricing.js'
import {
  addHours,
  assertArray,
  createNumericOrderId,
  createRef,
  deepClone,
  normalizeString,
  roundCurrency,
  startOfHour,
  subtractHours,
  toEnumValue,
} from './utils.js'

const SPECIAL_REVIEW_TERMS = ['custom', 'onsite', 'staffed', 'chef', 'quote', 'negotiated', 'decor']

const ACTIVE_ORDER_STATUSES = new Set([
  ORDER_STATUSES.REVIEW_REQUIRED,
  ORDER_STATUSES.PENDING_PAYMENT,
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.IN_PREP,
  ORDER_STATUSES.READY,
  ORDER_STATUSES.OUT_FOR_DELIVERY,
])

const sanitizeGuestCount = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null
  }
  return Math.trunc(numeric)
}

const sanitizeServiceType = (value) => {
  const normalized = normalizeString(value).toLowerCase()
  return normalized === 'pickup' || normalized === 'delivery' ? normalized : ''
}

const paginate = (records, pageNo, recsPerPage) => {
  const safePageNo = Number.isFinite(pageNo) && pageNo > 0 ? Math.trunc(pageNo) : 1
  const safeRecsPerPage = Number.isFinite(recsPerPage) && recsPerPage > 0 ? Math.trunc(recsPerPage) : 20
  const start = (safePageNo - 1) * safeRecsPerPage

  return {
    records: records.slice(start, start + safeRecsPerPage),
    pagingDetails: {
      pageNo: safePageNo,
      recsPerPage: safeRecsPerPage,
      totalRecords: records.length,
      totalPages: Math.max(Math.ceil(records.length / safeRecsPerPage), 1),
    },
  }
}

const buildReviewFlag = (type, message, details = null) => ({ type, message, details })

const uniqueReviewFlags = (flags) => {
  const deduped = new Map()
  flags.forEach((flag) => {
    deduped.set(flag.type, flag)
  })
  return Array.from(deduped.values())
}

const createStoreSummary = (store) => ({
  refId: store.refId,
  name: store.name,
  aliasName: store.aliasName,
  address: store.address,
  phoneNumber: store.phoneNumber,
  businessRefId: store.businessRefId,
  currency: store.config.currency,
  geoLocation: {
    latitude: store.geoLocation.latitude,
    longitude: store.geoLocation.longitude,
  },
  listingConfig: deepClone(store.listingConfig),
  storeStatus: deepClone(store.storeStatus),
  config: {
    leadTimeHours: store.config.leadTimeHours,
    modifyCutoffHours: store.config.modifyCutoffHours,
    minimumOrderAmount: store.config.minimumOrderAmount,
    depositPercentage: store.config.depositPercentage,
    slotCapacityGuests: store.config.slotCapacityGuests,
    autoConfirmMaxGuests: store.config.autoConfirmMaxGuests,
    autoConfirmMaxTotal: store.config.autoConfirmMaxTotal,
    currency: store.config.currency,
  },
})

const toCartAccessDescriptor = (cart, authContext) => {
  const hasMatchingSession = cart.sessionRefId === authContext.sessionRefId
  const hasMatchingUser =
    authContext.isUserAuthenticated &&
    cart.customerDetails?.userRefId &&
    cart.customerDetails.userRefId === authContext.userProfile?.refId

  return { hasMatchingSession, hasMatchingUser }
}

export class CateringService {
  constructor(store) {
    this.store = store
  }

  assertBusinessAccess(authContext) {
    if (authContext.businessRefId !== this.store.getBusinessRefId()) {
      throw new HttpError(403, 'Unknown businessrefid for catering service')
    }
  }

  assertCartAccess(cart, authContext) {
    const access = toCartAccessDescriptor(cart, authContext)
    if (!access.hasMatchingSession && !access.hasMatchingUser) {
      throw new HttpError(403, 'You are not authorized to access this cart')
    }
  }

  getStoreOrThrow(restaurantRefId) {
    const store = this.store.getStoreByRefId(restaurantRefId)
    if (!store) {
      throw new HttpError(404, 'Restaurant not found')
    }
    return store
  }

  getPackageOrThrow(packageRefId) {
    const item = this.store.getPackageByRefId(packageRefId)
    if (!item || !item.isPublished) {
      throw new HttpError(404, `Package ${packageRefId} is not available`)
    }
    return item
  }

  getOrdersForSlot(restaurantRefId, eventDateTime, excludeOrderRefId = null) {
    const slotKey = startOfHour(eventDateTime)
    return this.store
      .listOrders()
      .filter((order) => {
        if (order.restaurantRefId !== restaurantRefId) return false
        if (order.orderRefId === excludeOrderRefId) return false
        if (order.eventDetails?.eventDateTime == null) return false
        if (TERMINAL_ORDER_STATUSES.has(order.orderStatus)) return false
        return startOfHour(order.eventDetails.eventDateTime) === slotKey
      })
  }

  buildEventDetails(input = {}, fallback = {}) {
    return {
      eventName: normalizeString(input.eventName) || normalizeString(fallback.eventName) || '',
      eventDateTime: normalizeString(input.eventDateTime) || normalizeString(fallback.eventDateTime) || '',
      serviceType: sanitizeServiceType(input.serviceType || fallback.serviceType),
      deliveryAddress:
        normalizeString(input.deliveryAddress) ||
        normalizeString(input.address) ||
        normalizeString(fallback.deliveryAddress) ||
        '',
      guestCount: sanitizeGuestCount(input.guestCount ?? fallback.guestCount),
      specialRequirements:
        normalizeString(input.specialRequirements) ||
        normalizeString(fallback.specialRequirements) ||
        '',
    }
  }

  buildCustomerDetails(authContext) {
    if (!authContext.isUserAuthenticated || !authContext.userProfile) {
      return {
        name: 'Guest Catering Customer',
        mobileNumber: '',
        countryCode: '+1',
        userRefId: null,
        balanceLoyaltyPoints: 0,
        isNewUser: true,
      }
    }

    const profile = authContext.userProfile
    return {
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      mobileNumber: profile.mobileNumber,
      countryCode: profile.countryCode,
      userRefId: profile.refId,
      balanceLoyaltyPoints: 0,
      isNewUser: false,
      emailAddress: profile.emailAddress,
    }
  }

  buildCartItems(itemInputs) {
    const categories = new Map(this.store.listCategories().map((entry) => [entry.refId, entry]))

    return assertArray(itemInputs).map((input) => {
      const quantity = Math.max(1, Math.trunc(Number(input.quantity) || 1))

      if (input.packageRefId) {
        const packageRecord = this.getPackageOrThrow(input.packageRefId)
        const subTotal = roundCurrency(packageRecord.price * quantity)
        const category = categories.get(packageRecord.categoryRefId)

        return {
          refId: createRef('cart_item'),
          packageRefId: packageRecord.refId,
          menuItemRefId: packageRecord.menuItemRefId,
          name: packageRecord.name,
          description: packageRecord.description,
          currency: 'USD',
          price: packageRecord.price,
          quantity,
          subTotal,
          serves: packageRecord.serves,
          unit: packageRecord.unit,
          imageUrl: packageRecord.imageUrl,
          categoryRefId: packageRecord.categoryRefId,
          categoryDetails: category ? { refId: category.refId, name: category.name } : null,
          specialInstructions: normalizeString(input.specialInstructions),
          modifierTypes: [],
          metadata: {
            packageItems: deepClone(packageRecord.packageItems),
            availabilitySettings: deepClone(packageRecord.availabilitySettings),
            cateringPackage: true,
          },
          menuItemSummary: {
            subTotal,
            originalSubTotal: subTotal,
            loyaltyAmount: 0,
            cashDiscount: 0,
            tax: 0,
            originalSalesTax: 0,
            serviceFee: 0,
            serviceFeeTax: 0,
            gratuityAmount: 0,
            gratuityTax: 0,
          },
        }
      }

      const menuItemRefId = normalizeString(input.menuItemRefId || input.menuRefId)
      if (!menuItemRefId) {
        throw new HttpError(400, 'Each cart item must include packageRefId or menuItemRefId')
      }

      const price = roundCurrency(Number(input.price))
      if (!Number.isFinite(price) || price < 0) {
        throw new HttpError(400, `Invalid price for menu item ${menuItemRefId}`)
      }

      const categoryRefId = normalizeString(input.categoryRefId)
      const category = categories.get(categoryRefId)
      const subTotal = roundCurrency(price * quantity)
      const serves = Math.max(1, Math.trunc(Number(input.serves) || 1))

      return {
        refId: createRef('cart_item'),
        packageRefId: null,
        menuItemRefId,
        name: normalizeString(input.name) || 'Catalog Item',
        description: normalizeString(input.description),
        currency: normalizeString(input.currency) || 'USD',
        price,
        quantity,
        subTotal,
        serves,
        unit: normalizeString(input.unit) || 'unit',
        imageUrl: normalizeString(input.imageUrl),
        categoryRefId,
        categoryDetails:
          categoryRefId || category
            ? {
                refId: categoryRefId || category?.refId || '',
                name: normalizeString(input.categoryName) || category?.name || 'Catalog Item',
              }
            : null,
        specialInstructions: normalizeString(input.specialInstructions),
        modifierTypes: deepClone(input.modifierTypes || []),
        metadata: {
          externalCatalogSnapshot: true,
          availabilitySettings: deepClone(input.availabilitySettings || []),
        },
        menuItemSummary: {
          subTotal,
          originalSubTotal: subTotal,
          loyaltyAmount: 0,
          cashDiscount: 0,
          tax: 0,
          originalSalesTax: 0,
          serviceFee: 0,
          serviceFeeTax: 0,
          gratuityAmount: 0,
          gratuityTax: 0,
        },
      }
    })
  }

  previewCheckout(order, amountDueNow) {
    return {
      currency: order.currency,
      amountDueNow,
      expiresAt: addHours(Date.now(), 48),
      url: `https://checkout.novacater.local/pay/${order.orderRefId}?amount=${amountDueNow.toFixed(2)}`,
    }
  }

  createPaymentSchedule(order, depositDetails) {
    const nowDue = depositDetails.dueNowAmount
    const laterDue = depositDetails.dueLaterAmount

    return [
      {
        refId: createRef('payment_schedule'),
        type: order.paymentOption,
        amount: nowDue,
        dueAt: order.createdAt,
        status: nowDue > 0 && order.paymentDetails.amountPaid >= nowDue ? 'PAID' : nowDue > 0 ? 'DUE_NOW' : 'NOT_REQUIRED',
      },
      ...(laterDue > 0
        ? [
            {
              refId: createRef('payment_schedule'),
              type: 'BALANCE',
              amount: laterDue,
              dueAt: order.eventDetails.eventDateTime,
              status: order.paymentDetails.remainingAmount > 0 ? 'SCHEDULED' : 'PAID',
            },
          ]
        : []),
    ]
  }

  buildValidation({ store, eventDetails, menuItems, paymentDetails, excludeOrderRefId = null }) {
    const errors = []
    const reviewFlags = []

    if (menuItems.length === 0) {
      errors.push({ code: 'EMPTY_CART', message: 'At least one catering package is required' })
    }

    if (!eventDetails.serviceType) {
      errors.push({ code: 'SERVICE_TYPE_REQUIRED', message: 'serviceType is required' })
    }

    if (!eventDetails.eventDateTime) {
      errors.push({ code: 'EVENT_DATETIME_REQUIRED', message: 'eventDateTime is required' })
    }

    if (!eventDetails.guestCount) {
      errors.push({ code: 'GUEST_COUNT_REQUIRED', message: 'guestCount is required' })
    }

    if (eventDetails.serviceType === 'delivery' && !eventDetails.deliveryAddress) {
      errors.push({ code: 'DELIVERY_ADDRESS_REQUIRED', message: 'deliveryAddress is required for delivery orders' })
    }

    let parsedEventDate = null
    if (eventDetails.eventDateTime) {
      parsedEventDate = new Date(eventDetails.eventDateTime)
      if (Number.isNaN(parsedEventDate.getTime())) {
        errors.push({ code: 'INVALID_EVENT_DATETIME', message: 'eventDateTime must be a valid ISO date' })
      } else if (parsedEventDate.getTime() <= Date.now()) {
        errors.push({ code: 'EVENT_IN_PAST', message: 'eventDateTime must be in the future' })
      }
    }

    if (parsedEventDate) {
      const eventDateOnly = parsedEventDate.toISOString().slice(0, 10)
      if (store.config.blackoutDates.includes(eventDateOnly)) {
        reviewFlags.push(
          buildReviewFlag(REVIEW_FLAG_TYPES.BLACKOUT_DATE, 'Selected date is a blackout date and requires manual review', {
            date: eventDateOnly,
          }),
        )
      }

      const hoursUntilEvent = (parsedEventDate.getTime() - Date.now()) / (1000 * 60 * 60)
      if (hoursUntilEvent < store.config.leadTimeHours) {
        reviewFlags.push(
          buildReviewFlag(REVIEW_FLAG_TYPES.LEAD_TIME_BREACH, 'Selected event time is inside the standard catering lead time', {
            requiredLeadTimeHours: store.config.leadTimeHours,
          }),
        )
      }

      const ordersInSlot = this.getOrdersForSlot(store.refId, parsedEventDate.toISOString(), excludeOrderRefId)
      const bookedGuests = ordersInSlot.reduce((sum, order) => sum + (order.eventDetails.guestCount || 0), 0)
      if (bookedGuests + (eventDetails.guestCount || 0) > store.config.slotCapacityGuests) {
        reviewFlags.push(
          buildReviewFlag(REVIEW_FLAG_TYPES.SLOT_SATURATED, 'The requested slot is above auto-confirm capacity', {
            slotCapacityGuests: store.config.slotCapacityGuests,
            bookedGuests,
          }),
        )
      }
    }

    if (eventDetails.serviceType === 'delivery') {
      const normalizedAddress = eventDetails.deliveryAddress.toLowerCase()
      const matchedZone = store.deliveryZones.find((zone) =>
        zone.matchTerms.some((term) => normalizedAddress.includes(term.toLowerCase())),
      )
      if (!matchedZone) {
        reviewFlags.push(
          buildReviewFlag(REVIEW_FLAG_TYPES.DELIVERY_OUTSIDE_ZONE, 'Delivery address falls outside the auto-confirm zone', {
            address: eventDetails.deliveryAddress,
          }),
        )
      }
    }

    if (paymentDetails.subTotal > 0 && paymentDetails.subTotal < store.config.minimumOrderAmount) {
      reviewFlags.push(
        buildReviewFlag(REVIEW_FLAG_TYPES.MIN_ORDER_NOT_MET, 'Order total is below the standard catering minimum', {
          minimumOrderAmount: store.config.minimumOrderAmount,
        }),
      )
    }

    if (eventDetails.guestCount && eventDetails.guestCount > store.config.autoConfirmMaxGuests) {
      reviewFlags.push(
        buildReviewFlag(REVIEW_FLAG_TYPES.GUEST_COUNT_ABOVE_AUTO_CONFIRM, 'Guest count is above the auto-confirm limit', {
          autoConfirmMaxGuests: store.config.autoConfirmMaxGuests,
        }),
      )
    }

    if (paymentDetails.grandTotal > store.config.autoConfirmMaxTotal) {
      reviewFlags.push(
        buildReviewFlag(REVIEW_FLAG_TYPES.TOTAL_ABOVE_AUTO_CONFIRM, 'Order total is above the auto-confirm limit', {
          autoConfirmMaxTotal: store.config.autoConfirmMaxTotal,
        }),
      )
    }

    if (eventDetails.specialRequirements) {
      const normalized = eventDetails.specialRequirements.toLowerCase()
      if (SPECIAL_REVIEW_TERMS.some((term) => normalized.includes(term))) {
        reviewFlags.push(
          buildReviewFlag(REVIEW_FLAG_TYPES.SPECIAL_REQUEST_REVIEW, 'Special requirements need manual catering review', {
            specialRequirements: eventDetails.specialRequirements,
          }),
        )
      }
    }

    const normalizedReviewFlags = uniqueReviewFlags(reviewFlags)

    return {
      isValid: errors.length === 0,
      canSubmit: errors.length === 0,
      reviewRequired: normalizedReviewFlags.length > 0,
      canAutoConfirm: errors.length === 0 && normalizedReviewFlags.length === 0,
      errors,
      warnings: normalizedReviewFlags.map((flag) => flag.message),
      reviewFlags: normalizedReviewFlags,
    }
  }

  createCartSnapshot({ existingCart = null, authContext, store, eventDetails, itemInputs }) {
    const menuItems = this.buildCartItems(itemInputs)
    const totals = calculateTotals({
      store,
      serviceType: eventDetails.serviceType || 'pickup',
      deliveryAddress: eventDetails.deliveryAddress,
      menuItems,
    })
    const validation = this.buildValidation({
      store,
      eventDetails,
      menuItems,
      paymentDetails: totals.paymentDetails,
    })
    const previewDeposit = calculateDepositDetails({
      paymentOption: PAYMENT_OPTIONS.PAY_DEPOSIT,
      paymentDetails: totals.paymentDetails,
      store,
    })
    return {
      refId: existingCart?.refId || createRef('cart'),
      businessRefId: store.businessRefId,
      restaurantRefId: store.refId,
      currency: store.config.currency,
      orderType: SERVICE_TYPE_TO_ORDER_TYPE[eventDetails.serviceType] || 'TakeAway',
      displayOrderType: eventDetails.serviceType === 'delivery' ? 'Delivery' : 'Pickup',
      sessionRefId: authContext.sessionRefId,
      createdAt: existingCart?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventDetails,
      menuItems,
      paymentDetails: totals.paymentDetails,
      paymentEntities: totals.paymentEntities,
      depositDetails: {
        depositPercentage: store.config.depositPercentage,
        depositAmount: previewDeposit.depositAmount,
        previewOptions: {
          [PAYMENT_OPTIONS.PAY_FULL]: totals.paymentDetails.grandTotal,
          [PAYMENT_OPTIONS.PAY_DEPOSIT]: previewDeposit.depositAmount,
          [PAYMENT_OPTIONS.PAY_LATER]: 0,
        },
        currency: store.config.currency,
      },
      validation,
      reviewFlags: validation.reviewFlags,
      lockAt: eventDetails.eventDateTime ? subtractHours(eventDetails.eventDateTime, store.config.modifyCutoffHours) : null,
      customerDetails: existingCart?.customerDetails || this.buildCustomerDetails(authContext),
      storeDetails: createStoreSummary(store),
      itemInputs: assertArray(itemInputs).map((item) => ({
        packageRefId: item.packageRefId,
        menuItemRefId: normalizeString(item.menuItemRefId || item.menuRefId),
        categoryRefId: normalizeString(item.categoryRefId),
        categoryName: normalizeString(item.categoryName),
        name: normalizeString(item.name),
        description: normalizeString(item.description),
        imageUrl: normalizeString(item.imageUrl),
        currency: normalizeString(item.currency) || 'USD',
        unit: normalizeString(item.unit),
        serves: Number(item.serves) || 1,
        price: Number(item.price) || 0,
        quantity: Math.max(1, Math.trunc(Number(item.quantity) || 1)),
        specialInstructions: normalizeString(item.specialInstructions),
      })),
    }
  }

  searchStores(authContext, body) {
    this.assertBusinessAccess(authContext)

    const eventDetails = this.buildEventDetails(body)
    if (!eventDetails.eventDateTime || !eventDetails.serviceType || !eventDetails.guestCount) {
      throw new HttpError(400, 'address, serviceType, eventDateTime, and guestCount are required for store search')
    }

    const stores = this.store.listStores().map((store) => {
      const menuItems = [
        {
          subTotal: store.config.minimumOrderAmount,
        },
      ]
      const totals = {
        paymentDetails: {
          subTotal: store.config.minimumOrderAmount,
          grandTotal: store.config.minimumOrderAmount,
        },
      }
      const validation = this.buildValidation({
        store,
        eventDetails,
        menuItems,
        paymentDetails: totals.paymentDetails,
      })

      return {
        ...createStoreSummary(store),
        eligible: validation.isValid,
        slotAvailable: !validation.reviewFlags.some((flag) => flag.type === REVIEW_FLAG_TYPES.SLOT_SATURATED),
        reviewRequired: validation.reviewRequired,
        validation,
        minimumOrderAmount: store.config.minimumOrderAmount,
        cutoffAt: subtractHours(eventDetails.eventDateTime, store.config.leadTimeHours),
      }
    })

    return {
      summary: {
        totalStores: stores.length,
        eligibleStores: stores.filter((store) => store.eligible).length,
      },
      records: stores,
    }
  }

  getCatalog(authContext, restaurantRefId, query) {
    this.assertBusinessAccess(authContext)
    const store = this.getStoreOrThrow(restaurantRefId)
    const eventDetails = this.buildEventDetails(query)

    const categories = this.store.listCategories()
    const packages = this.store.listPackages()
    const categoryList = categories.map((category) => ({
      ...category,
      packages: packages.filter((item) => item.categoryRefId === category.refId),
    }))

    return {
      restaurantRefId: store.refId,
      businessRefId: store.businessRefId,
      storeDetails: createStoreSummary(store),
      categoryList,
      preview: eventDetails.eventDateTime && eventDetails.serviceType && eventDetails.guestCount
        ? this.searchStores(authContext, {
            address: eventDetails.deliveryAddress || store.address,
            serviceType: eventDetails.serviceType,
            eventDateTime: eventDetails.eventDateTime,
            guestCount: eventDetails.guestCount,
          }).records.find((entry) => entry.refId === restaurantRefId)
        : null,
    }
  }

  createCart(authContext, body) {
    this.assertBusinessAccess(authContext)

    const restaurantRefId = normalizeString(body?.restaurantRefId) || authContext.restaurantRefId
    if (!restaurantRefId) {
      throw new HttpError(400, 'restaurantRefId is required')
    }

    const store = this.getStoreOrThrow(restaurantRefId)
    const eventDetails = this.buildEventDetails(body)
    const itemInputs = assertArray(body?.items)

    const cart = this.createCartSnapshot({
      authContext,
      store,
      eventDetails,
      itemInputs,
    })

    return this.store.saveCart(cart)
  }

  getCart(authContext, cartRefId) {
    this.assertBusinessAccess(authContext)
    const cart = this.store.getCart(cartRefId)
    if (!cart) {
      throw new HttpError(404, 'Cart not found')
    }
    this.assertCartAccess(cart, authContext)
    return cart
  }

  updateCart(authContext, cartRefId, body) {
    const current = this.getCart(authContext, cartRefId)
    const store = this.getStoreOrThrow(current.restaurantRefId)
    const eventDetails = this.buildEventDetails(body, current.eventDetails)
    const itemInputs = body?.items ? assertArray(body.items) : current.itemInputs

    const updated = this.createCartSnapshot({
      existingCart: current,
      authContext,
      store,
      eventDetails,
      itemInputs,
    })

    return this.store.saveCart(updated)
  }

  deleteCart(authContext, cartRefId) {
    const current = this.getCart(authContext, cartRefId)
    this.store.deleteCart(current.refId)
  }

  validateCart(authContext, cartRefId) {
    const cart = this.getCart(authContext, cartRefId)
    const store = this.getStoreOrThrow(cart.restaurantRefId)
    const refreshed = this.createCartSnapshot({
      existingCart: cart,
      authContext,
      store,
      eventDetails: cart.eventDetails,
      itemInputs: cart.itemInputs,
    })

    return this.store.saveCart(refreshed)
  }

  normalizePaymentOption(value) {
    const normalized = toEnumValue(value)
    if (!Object.values(PAYMENT_OPTIONS).includes(normalized)) {
      throw new HttpError(400, 'paymentOption must be PAY_FULL, PAY_DEPOSIT, or PAY_LATER')
    }
    return normalized
  }

  buildOrderFromCart({ authContext, cart, paymentOption, eventDetails }) {
    const store = this.getStoreOrThrow(cart.restaurantRefId)
    const totals = calculateTotals({
      store,
      serviceType: eventDetails.serviceType,
      deliveryAddress: eventDetails.deliveryAddress,
      menuItems: cart.menuItems,
    })
    const validation = this.buildValidation({
      store,
      eventDetails,
      menuItems: cart.menuItems,
      paymentDetails: totals.paymentDetails,
    })

    if (!validation.isValid) {
      throw new HttpError(409, 'Cart is not ready to submit', {
        validation,
      })
    }

    const depositDetails = calculateDepositDetails({
      paymentOption,
      paymentDetails: totals.paymentDetails,
      store,
    })

    const createdAt = new Date().toISOString()
    const amountPaid = 0
    const paymentDetails = applyPaymentToDetails({
      paymentDetails: totals.paymentDetails,
      amountPaid,
      paymentOption,
      depositDetails,
    })

    let orderStatus = ORDER_STATUSES.CONFIRMED
    let paymentStatus = paymentDetails.remainingAmount > 0 ? PAYMENT_STATUSES.UNPAID : PAYMENT_STATUSES.PAID
    let checkout = null

    if (validation.reviewRequired) {
      orderStatus = ORDER_STATUSES.REVIEW_REQUIRED
      paymentStatus = PAYMENT_STATUSES.UNPAID
    } else if (paymentOption === PAYMENT_OPTIONS.PAY_LATER) {
      orderStatus = ORDER_STATUSES.CONFIRMED
      paymentStatus = PAYMENT_STATUSES.UNPAID
    } else {
      orderStatus = ORDER_STATUSES.PENDING_PAYMENT
      paymentStatus =
        paymentOption === PAYMENT_OPTIONS.PAY_DEPOSIT
          ? PAYMENT_STATUSES.DEPOSIT_PENDING
          : PAYMENT_STATUSES.UNPAID
      checkout = this.previewCheckout(
        {
          orderRefId: createRef('preview'),
          currency: cart.currency,
        },
        depositDetails.dueNowAmount,
      )
    }

    const order = {
      orderRefId: createRef('order'),
      orderId: createNumericOrderId(),
      refId: cart.refId,
      businessRefId: cart.businessRefId,
      restaurantRefId: cart.restaurantRefId,
      currency: cart.currency,
      orderType: cart.orderType,
      displayOrderType: cart.displayOrderType,
      applicationName: authContext.applicationName,
      sessionRefId: cart.sessionRefId,
      paymentOption,
      orderStatus,
      orderPaymentStatus: paymentStatus,
      paymentDetails,
      paymentEntities: totals.paymentEntities,
      depositDetails,
      reviewFlags: validation.reviewFlags,
      validation,
      lockAt: eventDetails.eventDateTime ? subtractHours(eventDetails.eventDateTime, store.config.modifyCutoffHours) : null,
      eventDetails,
      menuItems: deepClone(cart.menuItems),
      storeDetails: createStoreSummary(store),
      customerDetails: this.buildCustomerDetails(authContext),
      createdAt,
      updatedAt: createdAt,
      checkout,
      amountPaid,
      paymentSchedule: [],
      cancellationReason: null,
      canModify: true,
      canCancel: true,
    }

    order.checkout =
      checkout && order.orderStatus === ORDER_STATUSES.PENDING_PAYMENT
        ? this.previewCheckout(order, depositDetails.dueNowAmount)
        : null
    order.paymentSchedule = this.createPaymentSchedule(order, depositDetails)
    order.fulfillmentPayload = buildOmsPayload(order)
    return order
  }

  submitOrder(authContext, body) {
    this.assertBusinessAccess(authContext)
    if (!authContext.isUserAuthenticated) {
      throw new HttpError(401, 'Authenticated user token required to place a catering order')
    }

    const cartRefId = normalizeString(body?.cartRefId)
    if (!cartRefId) {
      throw new HttpError(400, 'cartRefId is required')
    }

    const cart = this.getCart(authContext, cartRefId)
    const paymentOption = this.normalizePaymentOption(body?.paymentOption)
    const eventDetails = this.buildEventDetails(body, cart.eventDetails)
    const order = this.buildOrderFromCart({
      authContext,
      cart,
      paymentOption,
      eventDetails,
    })

    const saved = this.store.saveOrder(order)
    this.store.appendOrderEvent(saved.orderRefId, {
      refId: createRef('order_event'),
      type: 'ORDER_CREATED',
      createdAt: saved.createdAt,
      details: {
        paymentOption,
        orderStatus: saved.orderStatus,
      },
    })
    return saved
  }

  getStoredOrderForUser(authContext, orderRefId) {
    this.assertBusinessAccess(authContext)
    const order = this.store.getOrder(orderRefId)
    if (!order) {
      throw new HttpError(404, 'Order not found')
    }
    assertOrderOwnership(order, authContext)
    return order
  }

  getOrder(authContext, orderRefId) {
    const order = this.getStoredOrderForUser(authContext, orderRefId)
    return {
      ...order,
      events: this.store.listOrderEvents(orderRefId),
    }
  }

  listOrders(authContext, query) {
    this.assertBusinessAccess(authContext)
    if (!authContext.isUserAuthenticated) {
      throw new HttpError(401, 'Authenticated user token required to view order history')
    }

    const allOrders = this.store
      .listOrders()
      .filter((order) => order.customerDetails?.userRefId === authContext.userProfile.refId)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

    const groupName = normalizeString(query.groupName).toLowerCase()
    let filtered = allOrders

    if (groupName === 'active') {
      filtered = allOrders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.orderStatus))
    } else if (groupName === 'past') {
      filtered = allOrders.filter((order) => order.orderStatus === ORDER_STATUSES.COMPLETED)
    } else if (groupName === 'cancelled') {
      filtered = allOrders.filter((order) => order.orderStatus === ORDER_STATUSES.CANCELLED)
    }

    const { records, pagingDetails } = paginate(filtered, Number(query.pageNo), Number(query.recsPerPage))

    return {
      summary: {
        openOrdersCount: allOrders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.orderStatus)).length,
        pastOrdersCount: allOrders.filter((order) => order.orderStatus === ORDER_STATUSES.COMPLETED).length,
        openCancelledVoidedOrdersCount: allOrders.filter((order) => order.orderStatus === ORDER_STATUSES.CANCELLED).length,
      },
      records,
      pagingDetails,
    }
  }

  updateOrder(authContext, orderRefId, body) {
    const current = this.getStoredOrderForUser(authContext, orderRefId)
    if (current.lockAt && new Date(current.lockAt).getTime() <= Date.now()) {
      throw new HttpError(409, 'Order is locked for modification. Please contact support.')
    }

    if (TERMINAL_ORDER_STATUSES.has(current.orderStatus)) {
      throw new HttpError(409, 'This order can no longer be modified')
    }

    const store = this.getStoreOrThrow(current.restaurantRefId)
    const eventDetails = this.buildEventDetails(body, current.eventDetails)
    const itemInputs = body?.items
      ? assertArray(body.items)
      : current.menuItems.map((item) => ({
          packageRefId: item.packageRefId,
          menuItemRefId: item.menuItemRefId,
          categoryRefId: item.categoryRefId,
          categoryName: item.categoryDetails?.name,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          currency: item.currency,
          unit: item.unit,
          serves: item.serves,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
        }))

    const menuItems = this.buildCartItems(itemInputs)
    const totals = calculateTotals({
      store,
      serviceType: eventDetails.serviceType,
      deliveryAddress: eventDetails.deliveryAddress,
      menuItems,
    })
    const validation = this.buildValidation({
      store,
      eventDetails,
      menuItems,
      paymentDetails: totals.paymentDetails,
      excludeOrderRefId: current.orderRefId,
    })

    if (!validation.isValid) {
      throw new HttpError(409, 'Updated order data is not valid', { validation })
    }

    const paymentOption =
      body?.paymentOption && current.paymentDetails.amountPaid === 0
        ? this.normalizePaymentOption(body.paymentOption)
        : current.paymentOption

    const depositDetails = calculateDepositDetails({
      paymentOption,
      paymentDetails: totals.paymentDetails,
      store,
    })
    const paymentDetails = applyPaymentToDetails({
      paymentDetails: totals.paymentDetails,
      amountPaid: current.paymentDetails.amountPaid,
      paymentOption,
      depositDetails,
    })

    let orderStatus = current.orderStatus
    let orderPaymentStatus = current.orderPaymentStatus
    let checkout = null

    if (validation.reviewRequired) {
      orderStatus = ORDER_STATUSES.REVIEW_REQUIRED
      orderPaymentStatus = PAYMENT_STATUSES.UNPAID
    } else if (paymentOption === PAYMENT_OPTIONS.PAY_LATER) {
      orderStatus = ORDER_STATUSES.CONFIRMED
      orderPaymentStatus =
        current.paymentDetails.amountPaid > 0 ? PAYMENT_STATUSES.PARTIALLY_PAID : PAYMENT_STATUSES.UNPAID
    } else if (paymentDetails.amountPaid >= depositDetails.dueNowAmount && depositDetails.dueNowAmount > 0) {
      orderStatus = ORDER_STATUSES.CONFIRMED
      orderPaymentStatus = paymentDetails.remainingAmount > 0 ? PAYMENT_STATUSES.PARTIALLY_PAID : PAYMENT_STATUSES.PAID
    } else {
      orderStatus = ORDER_STATUSES.PENDING_PAYMENT
      orderPaymentStatus =
        paymentOption === PAYMENT_OPTIONS.PAY_DEPOSIT
          ? PAYMENT_STATUSES.DEPOSIT_PENDING
          : PAYMENT_STATUSES.UNPAID
      checkout = this.previewCheckout(current, depositDetails.dueNowAmount)
    }

    const updated = {
      ...current,
      updatedAt: new Date().toISOString(),
      paymentOption,
      eventDetails,
      menuItems,
      paymentDetails,
      paymentEntities: totals.paymentEntities,
      depositDetails,
      orderStatus,
      orderPaymentStatus,
      validation,
      reviewFlags: validation.reviewFlags,
      lockAt: eventDetails.eventDateTime ? subtractHours(eventDetails.eventDateTime, store.config.modifyCutoffHours) : current.lockAt,
      checkout,
    }

    updated.paymentSchedule = this.createPaymentSchedule(updated, depositDetails)
    updated.fulfillmentPayload = buildOmsPayload(updated)
    this.store.appendOrderEvent(updated.orderRefId, {
      refId: createRef('order_event'),
      type: 'ORDER_UPDATED',
      createdAt: updated.updatedAt,
      details: {
        orderStatus: updated.orderStatus,
        orderPaymentStatus: updated.orderPaymentStatus,
      },
    })
    return this.store.saveOrder(updated)
  }

  cancelOrder(authContext, orderRefId, body) {
    const current = this.getStoredOrderForUser(authContext, orderRefId)
    if (current.lockAt && new Date(current.lockAt).getTime() <= Date.now()) {
      throw new HttpError(409, 'Order is inside the cancellation cutoff. Please contact support.')
    }

    if (current.orderStatus === ORDER_STATUSES.CANCELLED) {
      return current
    }

    if (TERMINAL_ORDER_STATUSES.has(current.orderStatus) && current.orderStatus !== ORDER_STATUSES.CANCELLED) {
      throw new HttpError(409, 'This order can no longer be cancelled')
    }

    const updatedAt = new Date().toISOString()
    const updated = {
      ...current,
      updatedAt,
      orderStatus: ORDER_STATUSES.CANCELLED,
      orderPaymentStatus:
        current.paymentDetails.amountPaid > 0 ? PAYMENT_STATUSES.REFUND_PENDING : current.orderPaymentStatus,
      cancellationReason: normalizeString(body?.reason) || 'Cancelled by customer',
      canModify: false,
      canCancel: false,
      checkout: null,
    }

    this.store.appendOrderEvent(updated.orderRefId, {
      refId: createRef('order_event'),
      type: 'ORDER_CANCELLED',
      createdAt: updatedAt,
      details: {
        reason: updated.cancellationReason,
      },
    })

    return this.store.saveOrder(updated)
  }

  checkoutOrder(authContext, orderRefId) {
    const current = this.getStoredOrderForUser(authContext, orderRefId)

    if (current.orderStatus === ORDER_STATUSES.REVIEW_REQUIRED) {
      throw new HttpError(409, 'Review-required orders cannot generate checkout until approved')
    }

    if (current.paymentOption === PAYMENT_OPTIONS.PAY_LATER) {
      throw new HttpError(409, 'Pay-later orders do not need a checkout link')
    }

    const dueNowAmount =
      current.paymentOption === PAYMENT_OPTIONS.PAY_FULL
        ? current.paymentDetails.remainingAmount
        : Math.max(current.depositDetails.depositAmount - current.paymentDetails.amountPaid, 0)

    if (dueNowAmount <= 0) {
      throw new HttpError(409, 'No outstanding payment is due right now')
    }

    const checkout = this.previewCheckout(current, dueNowAmount)
    const updated = {
      ...current,
      updatedAt: new Date().toISOString(),
      checkout,
      orderStatus: ORDER_STATUSES.PENDING_PAYMENT,
    }
    this.store.appendOrderEvent(updated.orderRefId, {
      refId: createRef('order_event'),
      type: 'CHECKOUT_REGENERATED',
      createdAt: updated.updatedAt,
      details: {
        amountDueNow: dueNowAmount,
      },
    })

    return this.store.saveOrder(updated)
  }

  payOrder(authContext, orderRefId, body) {
    const current = this.getStoredOrderForUser(authContext, orderRefId)

    if (current.orderStatus === ORDER_STATUSES.REVIEW_REQUIRED) {
      throw new HttpError(409, 'Review-required orders cannot be paid until approved')
    }

    let amount = Number(body?.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      amount =
        current.paymentOption === PAYMENT_OPTIONS.PAY_FULL
          ? current.paymentDetails.remainingAmount
          : current.paymentDetails.amountPaid < current.depositDetails.depositAmount
            ? current.depositDetails.depositAmount - current.paymentDetails.amountPaid
            : current.paymentDetails.remainingAmount
    }

    return this.confirmPayment({
      orderRefId,
      amount,
      paymentReference: createRef('payment'),
      idempotencyKey: createRef('pay_event'),
    })
  }

  confirmPayment({ orderRefId, amount, paymentReference, idempotencyKey }) {
    const order = this.store.getOrder(orderRefId)
    if (!order) {
      throw new HttpError(404, 'Order not found')
    }

    const idempotencyToken = normalizeString(idempotencyKey) || normalizeString(paymentReference)
    if (!idempotencyToken) {
      throw new HttpError(400, 'idempotencyKey or paymentReference is required')
    }

    if (this.store.hasProcessedPayment(idempotencyToken)) {
      return this.store.getProcessedPayment(idempotencyToken)
    }

    const normalizedAmount = roundCurrency(Number(amount))
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new HttpError(400, 'Payment amount must be a positive number')
    }

    const updatedAt = new Date().toISOString()
    const paymentDetails = applyPaymentToDetails({
      paymentDetails: order.paymentDetails,
      amountPaid: order.paymentDetails.amountPaid + normalizedAmount,
      paymentOption: order.paymentOption,
      depositDetails: order.depositDetails,
    })

    let orderStatus = order.orderStatus
    let orderPaymentStatus = PAYMENT_STATUSES.PARTIALLY_PAID

    if (paymentDetails.remainingAmount <= 0) {
      orderStatus = ORDER_STATUSES.CONFIRMED
      orderPaymentStatus = PAYMENT_STATUSES.PAID
    } else if (
      order.paymentOption === PAYMENT_OPTIONS.PAY_DEPOSIT &&
      paymentDetails.amountPaid >= order.depositDetails.depositAmount
    ) {
      orderStatus = ORDER_STATUSES.CONFIRMED
      orderPaymentStatus = PAYMENT_STATUSES.PARTIALLY_PAID
    } else if (order.paymentOption === PAYMENT_OPTIONS.PAY_FULL) {
      orderStatus = ORDER_STATUSES.PENDING_PAYMENT
      orderPaymentStatus = PAYMENT_STATUSES.PARTIALLY_PAID
    } else {
      orderStatus = ORDER_STATUSES.CONFIRMED
      orderPaymentStatus = PAYMENT_STATUSES.PARTIALLY_PAID
    }

    const updated = {
      ...order,
      updatedAt,
      paymentDetails,
      orderStatus,
      orderPaymentStatus,
      checkout: paymentDetails.remainingAmount > 0 && order.paymentOption !== PAYMENT_OPTIONS.PAY_LATER
        ? this.previewCheckout(order, paymentDetails.remainingAmount)
        : null,
    }

    updated.paymentSchedule = this.createPaymentSchedule(updated, updated.depositDetails)
    updated.fulfillmentPayload = buildOmsPayload(updated)

    this.store.appendOrderEvent(updated.orderRefId, {
      refId: createRef('order_event'),
      type: 'PAYMENT_CONFIRMED',
      createdAt: updatedAt,
      details: {
        amount: normalizedAmount,
        paymentReference,
      },
    })

    const saved = this.store.saveOrder(updated)
    this.store.markPaymentProcessed(idempotencyToken, saved)
    return saved
  }
}
