import { PAYMENT_OPTIONS, PAYMENT_STATUSES } from './constants.js'
import { roundCurrency } from './utils.js'

export const resolveDeliveryZone = (store, serviceType, deliveryAddress) => {
  if (serviceType !== 'delivery') {
    return {
      supported: true,
      matchedZone: null,
      deliveryFee: 0,
    }
  }

  const normalizedAddress = String(deliveryAddress || '').toLowerCase()
  const matchedZone = store.deliveryZones.find((zone) =>
    zone.matchTerms.some((term) => normalizedAddress.includes(term.toLowerCase())),
  )

  if (!matchedZone) {
    return {
      supported: false,
      matchedZone: null,
      deliveryFee: roundCurrency(store.config.deliveryFee),
    }
  }

  return {
    supported: true,
    matchedZone,
    deliveryFee: roundCurrency(store.config.deliveryFee + matchedZone.surcharge),
  }
}

export const calculateTotals = ({ store, serviceType, deliveryAddress, menuItems }) => {
  const subTotal = roundCurrency(menuItems.reduce((sum, item) => sum + item.subTotal, 0))
  const zone = resolveDeliveryZone(store, serviceType, deliveryAddress)
  const serviceFee = roundCurrency(subTotal * store.config.serviceFeeRate)
  const deliveryFee = zone.deliveryFee
  const taxBase = subTotal + serviceFee + deliveryFee
  const tax = roundCurrency(taxBase * store.config.taxRate)
  const grandTotal = roundCurrency(subTotal + serviceFee + deliveryFee + tax)

  return {
    zone,
    paymentDetails: {
      subTotal,
      originalSubTotal: subTotal,
      tax,
      originalSalesTax: tax,
      serviceFee,
      serviceFeeTax: 0,
      tips: 0,
      tipTax: 0,
      gratuityAmount: 0,
      gratuityTax: 0,
      grandTotal,
      extraCharges: deliveryFee,
      totalTax: tax,
      originalTotalTax: tax,
      combinedTaxAndFees: roundCurrency(tax + serviceFee + deliveryFee),
      discount: 0,
      refundAmount: 0,
      refundStatus: 'NA',
      paymentByMoney: grandTotal,
      amountPaid: 0,
      amountPaidByGiftCard: 0,
      amountPaidByOthers: 0,
      paymentByPoints: 0,
      voidAmount: 0,
      compAmount: null,
      refundReason: [],
      status: 'Ready to pay',
      refundState: null,
      remainingAmount: grandTotal,
      originalGrandTotal: grandTotal,
    },
    paymentEntities: [
      { label: 'Subtotal', value: subTotal },
      { label: 'Service Fee', value: serviceFee },
      ...(deliveryFee > 0 ? [{ label: 'Delivery Fee', value: deliveryFee }] : []),
      { label: 'Tax', value: tax },
      { label: 'Grand Total', value: grandTotal },
    ],
  }
}

export const calculateDepositDetails = ({ paymentOption, paymentDetails, store }) => {
  const depositAmount = roundCurrency(paymentDetails.grandTotal * store.config.depositPercentage)
  const dueNowAmount =
    paymentOption === PAYMENT_OPTIONS.PAY_FULL
      ? paymentDetails.grandTotal
      : paymentOption === PAYMENT_OPTIONS.PAY_DEPOSIT
        ? depositAmount
        : 0

  return {
    paymentOption,
    depositPercentage: store.config.depositPercentage,
    depositAmount,
    dueNowAmount,
    dueLaterAmount: roundCurrency(paymentDetails.grandTotal - dueNowAmount),
    currency: store.config.currency,
  }
}

export const applyPaymentToDetails = ({ paymentDetails, amountPaid, paymentOption, depositDetails }) => {
  const normalizedPaid = roundCurrency(amountPaid)
  const remainingAmount = roundCurrency(Math.max(paymentDetails.grandTotal - normalizedPaid, 0))
  let paymentStatus = PAYMENT_STATUSES.UNPAID
  let statusLabel = 'Ready to pay'

  if (normalizedPaid <= 0) {
    paymentStatus =
      paymentOption === PAYMENT_OPTIONS.PAY_DEPOSIT
        ? PAYMENT_STATUSES.DEPOSIT_PENDING
        : PAYMENT_STATUSES.UNPAID
  } else if (remainingAmount <= 0) {
    paymentStatus = PAYMENT_STATUSES.PAID
    statusLabel = 'Paid'
  } else {
    paymentStatus = PAYMENT_STATUSES.PARTIALLY_PAID
    statusLabel = 'Partially paid'

    if (paymentOption === PAYMENT_OPTIONS.PAY_DEPOSIT && normalizedPaid < depositDetails.depositAmount) {
      paymentStatus = PAYMENT_STATUSES.DEPOSIT_PENDING
      statusLabel = 'Deposit pending'
    }
  }

  return {
    ...paymentDetails,
    amountPaid: normalizedPaid,
    remainingAmount,
    status: statusLabel,
  }
}
