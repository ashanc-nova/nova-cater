export type GtagEventPayload = Record<string, unknown>;

const isGtagAvailable = () => typeof window !== 'undefined' && typeof window.gtag === 'function';

// Base tracking function
export const trackCustomEvent = (eventName: string, payload: GtagEventPayload = {}) => {
  if (!isGtagAvailable()) {
    console.warn('[Analytics] gtag not available, skipping event:', eventName);
    return;
  }

  window.gtag('event', eventName, payload);
};

// ========================================
// PAGE VIEW TRACKING
// ========================================
export const trackPageView = (pagePath: string, pageTitle: string, restaurantId?: string) => {
  const payload: GtagEventPayload = {
    page_location: window.location.href,
    page_path: pagePath,
    page_title: pageTitle,
  };

  if (restaurantId) {
    payload.restaurant_id = restaurantId;
  }

  trackCustomEvent('page_view', payload);
};

// ========================================
// USER ENGAGEMENT TRACKING
// ========================================
export const trackUserEngagement = (
  engagementTimeMs: number,
  restaurantId?: string,
  userId?: string,
  userType?: 'guest' | 'logged_in'
) => {
  const payload: GtagEventPayload = {
    engagement_time_msec: engagementTimeMs,
    restaurant_id: restaurantId,
  };

  // Add user type
  if (userType) {
    payload.user_type = userType;
  }

  // Add user ID if logged in
  if (userId) {
    payload.user_id = userId;
  }

  trackCustomEvent('user_engagement', payload);
};

// Helper to track session start
export const trackSessionStart = (
  restaurantId?: string,
  userId?: string,
  userType?: 'guest' | 'logged_in'
) => {
  const FIRST_VISIT_KEY = 'ga_first_visit_date';
  const RETURNING_USER_KEY = 'ga_is_returning_user';

  // Get or set first visit date
  let firstVisitDate = localStorage.getItem(FIRST_VISIT_KEY);
  let isReturningUser = false;

  if (!firstVisitDate) {
    // This is the user's FIRST visit
    firstVisitDate = new Date().toISOString();
    localStorage.setItem(FIRST_VISIT_KEY, firstVisitDate);
    isReturningUser = false;
  } else {
    // This is a RETURNING user (has visited before)
    isReturningUser = true;
    localStorage.setItem(RETURNING_USER_KEY, 'true');
  }

  const payload: GtagEventPayload = {
    restaurant_id: restaurantId,
    first_visit_date: firstVisitDate,
    is_returning_user: isReturningUser,
  };

  if (userType) {
    payload.user_type = userType;
  }

  if (userId) {
    payload.user_id = userId;
  }

  // Also send session_id for better session tracking
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  payload.session_id = sessionId;

  trackCustomEvent('session_start', payload);
};

export const trackScroll = (percentScrolled: number) => {
  trackCustomEvent('scroll', {
    percent_scrolled: percentScrolled,
  });
};

// ========================================
// MENU & ITEM TRACKING
// ========================================
export const trackViewItemList = (
  itemListId: string,
  itemListName: string,
  restaurantId?: string
) => {
  trackCustomEvent('view_item_list', {
    item_list_id: itemListId,
    item_list_name: itemListName,
    restaurant_id: restaurantId,
  });
};

export const trackViewItem = (
  itemId: string,
  itemName: string,
  category: string,
  price: number,
  restaurantId?: string
) => {
  trackCustomEvent('view_item', {
    item_id: itemId,
    item_name: itemName,
    category: category,
    price: price,
    restaurant_id: restaurantId,
  });
};

// ========================================
// CART TRACKING
// ========================================
export const trackAddToCart = (
  itemId: string,
  itemName: string,
  quantity: number,
  price: number,
  restaurantId?: string
) => {
  trackCustomEvent('add_to_cart', {
    item_id: itemId,
    item_name: itemName,
    quantity: quantity,
    price: price,
    restaurant_id: restaurantId,
    currency: 'USD',
    value: price * quantity,
  });
};

export const trackRemoveFromCart = (
  itemId: string,
  itemName: string,
  quantity: number,
  price: number,
  restaurantId?: string
) => {
  trackCustomEvent('remove_from_cart', {
    item_id: itemId,
    item_name: itemName,
    quantity: quantity,
    price: price,
    currency: 'USD',
    value: price * quantity,
    restaurant_id: restaurantId,
  });
};

// ========================================
// CHECKOUT TRACKING
// ========================================
export const trackBeginCheckout = (
  cartValue: number,
  itemsCount: number,
  restaurantId?: string
) => {
  trackCustomEvent('begin_checkout', {
    cart_value: cartValue,
    items_count: itemsCount,
    restaurant_id: restaurantId,
    currency: 'USD',
    value: cartValue,
  });
};

export const trackAddShippingInfo = (
  fulfillmentType: 'pickup' | 'delivery',
  pickupTime?: string,
  addressType?: string,
  restaurantId?: string
) => {
  trackCustomEvent('add_shipping_info', {
    fulfillment_type: fulfillmentType,
    pickup_time: pickupTime,
    address_type: addressType,
    restaurant_id: restaurantId,
  });
};

export const trackAddPaymentInfo = (
  paymentType: 'online' | 'restaurant',
  gateway?: string,
  restaurantId?: string
) => {
  trackCustomEvent('add_payment_info', {
    payment_type: paymentType,
    gateway: gateway || 'N/A',
    restaurant_id: restaurantId,
  });
};

// ========================================
// PURCHASE & CONVERSION TRACKING
// ========================================
// export const trackPurchase = (
//   transactionId: string,
//   value: number,
//   orderType: string,
//   restaurantId?: string,
//   items?: Array<{
//     item_id: string;
//     item_name: string;
//     price: number;
//     quantity: number;
//   }>
// ) => {
//   trackCustomEvent('purchase', {
//     transaction_id: transactionId,
//     value: value,
//     currency: 'USD',
//     restaurant_id: restaurantId,
//     order_type: orderType,
//     items: items,
//   });
// };

export const trackPaymentFailed = (
  errorCode: string,
  gateway: string,
  value: number,
  restaurantId?: string
) => {
  trackCustomEvent('payment_failed', {
    error_code: errorCode,
    gateway: gateway,
    value: value,
    restaurant_id: restaurantId,
  });
};

// ========================================
// CUSTOM EVENTS
// ========================================
export const trackItemOutOfStock = (
  itemId: string,
  reason: string,
  category: string,
  itemName: string
) => {
  trackCustomEvent('item_out_of_stock', {
    item_id: itemId,
    reason: reason,
    category: category,
    item_name: itemName,
  });
};

export const trackModifierSelected = (
  itemId: string,
  modifierName: string,
  modifierPrice: number
) => {
  trackCustomEvent('modifier_selected', {
    item_id: itemId,
    modifier_name: modifierName,
    modifier_price: modifierPrice,
  });
};

export const trackLoyaltyRedeemed = (
  pointsUsed: number,
  discountValue: number,
  restaurantId?: string
) => {
  trackCustomEvent('loyalty_redeemed', {
    points_used: pointsUsed,
    discount_value: discountValue,
    restaurant_id: restaurantId,
  });
};

export const trackTipAdded = (tipPercent: number, tipValue: number) => {
  trackCustomEvent('tip_added', {
    tip_percent: tipPercent,
    tip_value: tipValue,
  });
};

export const trackOrderStatusUpdated = (orderId: string, status: string, timestamp: string) => {
  trackCustomEvent('order_status_updated', {
    order_id: orderId,
    status: status,
    timestamp: timestamp,
  });
};
export const captureTrafficSource = () => {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer;

  // Extract UTM parameters
  const source = urlParams.get('utm_source');
  const medium = urlParams.get('utm_medium');
  const campaign = urlParams.get('utm_campaign');
  const content = urlParams.get('utm_content');
  const term = urlParams.get('utm_term');

  // Store in sessionStorage for later use
  const trafficData = {
    source: source || 'direct',
    medium: medium || 'none',
    campaign: campaign || '(not set)',
    content: content || '',
    term: term || '',
    referrer: referrer || 'direct',
    landingPage: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  // Only store if not already captured in this session
  if (!sessionStorage.getItem('traffic_source_captured')) {
    sessionStorage.setItem('traffic_source', JSON.stringify(trafficData));
    sessionStorage.setItem('traffic_source_captured', 'true');

    // Track as custom event
    trackCustomEvent('traffic_source_captured', trafficData);
  }

  return trafficData;
};

/**
 * Get stored traffic source data
 */
export const getTrafficSource = () => {
  if (typeof window === 'undefined') return null;

  const stored = sessionStorage.getItem('traffic_source');
  return stored ? JSON.parse(stored) : null;
};

// ========================================
// PURCHASE & CONVERSION TRACKING
// ========================================
export const trackPurchase = (
  transactionId: string,
  value: number,
  orderType: string,
  restaurantId?: string,
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>
) => {
  const trafficSource = getTrafficSource();

  trackCustomEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'USD',
    restaurant_id: restaurantId,
    order_type: orderType,
    items: items,
    // Include traffic source in purchase data for better attribution
    traffic_source: trafficSource?.source || 'direct',
    traffic_medium: trafficSource?.medium || 'none',
    traffic_campaign: trafficSource?.campaign || '(not set)',
    landing_page: trafficSource?.landingPage,
  });
};

// export const trackPromoImpression = (promoId: string, promoType: string, promoText: string) => {
//   trackCustomEvent('promo_impression', {
//     promo_id: promoId,
//     promo_type: promoType,
//     promo_text: promoText,
//   });
// };

// export const trackPromoClicked = (promoId: string, promoType: string, promoText: string) => {
//   trackCustomEvent('promo_clicked', {
//     promo_id: promoId,
//     promo_type: promoType,
//     promo_text: promoText,
//   });
// };
