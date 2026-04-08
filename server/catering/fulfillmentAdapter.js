import { SERVICE_TYPE_TO_ORDER_TYPE } from './constants.js'
import { createRef, roundCurrency } from './utils.js'

export const buildOmsPayload = (order) => {
  const menuItems = order.menuItems.flatMap((lineItem) =>
    lineItem.metadata.packageItems.map((packageItem) => {
      const quantity = lineItem.quantity * packageItem.quantity
      const subTotal = roundCurrency(lineItem.price * lineItem.quantity)

      return {
        refId: createRef('oms_item'),
        menuItemRefId: packageItem.menuItemRefId,
        orderRefId: order.orderRefId,
        name: `${lineItem.name} (${packageItem.quantity} per package)`,
        currency: order.currency,
        price: lineItem.price,
        quantity,
        subTotal,
        imageUrl: lineItem.imageUrl,
        categoryRefId: packageItem.categoryRefId,
        categoryDetails: lineItem.categoryDetails,
        measurement: {
          type: 'unit',
          value: null,
        },
        orderSource: order.applicationName,
        notes: lineItem.specialInstructions || '',
        metadata: {
          packageRefId: lineItem.packageRefId,
          packageQuantity: lineItem.quantity,
          catering: true,
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
    }),
  )

  return {
    refId: order.orderRefId,
    orderId: order.orderId,
    restaurantRefId: order.restaurantRefId,
    businessRefId: order.businessRefId,
    orderType: SERVICE_TYPE_TO_ORDER_TYPE[order.eventDetails.serviceType],
    displayOrderType: order.displayOrderType,
    applicationName: order.applicationName,
    menuItems,
    paymentDetails: order.paymentDetails,
    customerDetails: order.customerDetails,
    scheduledOrderDetails: {
      eventName: order.eventDetails.eventName,
      eventDateTime: order.eventDetails.eventDateTime,
      lockAt: order.lockAt,
    },
    metadata: {
      cateringOrder: true,
      paymentOption: order.paymentOption,
      reviewFlags: order.reviewFlags,
      specialRequirements: order.eventDetails.specialRequirements,
    },
  }
}
