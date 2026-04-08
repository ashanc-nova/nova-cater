import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCatering } from '../context/CateringContext'

const formatDate = (dateString) => {
  if (!dateString) return 'Date not specified'
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
const formatStatus = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const TERMINAL_ORDER_STATUSES = new Set(['CANCELLED', 'COMPLETED', 'REJECTED'])

export default function OrderSummary() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, fetchOrder, cancelOrder, payOutstandingOrder } = useCatering()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const orderId = searchParams.get('id')
    if (!orderId || !isAuthenticated) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    fetchOrder(orderId)
      .then((response) => {
        if (!cancelled) {
          setOrder(response)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load this order.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, searchParams])

  const refreshOrder = async () => {
    const orderId = searchParams.get('id')
    if (!orderId) return
    const response = await fetchOrder(orderId)
    setOrder(response)
  }

  const handleCancel = async () => {
    if (!order) return
    setActionLoading(true)
    setError('')
    try {
      await cancelOrder(order.orderRefId, order.restaurantRefId, 'Cancelled from customer portal')
      await refreshOrder()
    } catch (err) {
      setError(err.message || 'Unable to cancel this order.')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayNow = async () => {
    if (!order) return
    setActionLoading(true)
    setError('')
    try {
      await payOutstandingOrder(order)
      await refreshOrder()
    } catch (err) {
      setError(err.message || 'Unable to process payment right now.')
    } finally {
      setActionLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="glass rounded-3xl p-10 text-center">
          <p className="th-muted">Sign in from your profile to view your catering order details.</p>
          <Link to="/account" className="btn-primary text-sm py-2.5 px-5 inline-block mt-4">Go To Profile</Link>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="glass rounded-3xl p-10 text-center">
          <p className="th-muted">Loading order details...</p>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="text-center py-20">
          <p className="th-muted">{error || 'Order not found'}</p>
          <Link to="/account" className="text-primary-400 text-sm font-medium mt-2 inline-block hover:text-primary-300 transition-colors">Back to Profile</Link>
        </div>
      </main>
    )
  }

  const isTerminalOrder = TERMINAL_ORDER_STATUSES.has(order.orderStatus)
  const showPayButton =
    !isTerminalOrder &&
    order.orderStatus !== 'REVIEW_REQUIRED' &&
    Number(order.paymentDetails?.remainingAmount || 0) > 0
  const canModify = !isTerminalOrder
  const canCancel = !isTerminalOrder

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {error && (
        <div className="glass rounded-2xl p-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      <div className="mb-10 animate-slide-up">
        <Link to="/account" className="inline-flex items-center gap-1 th-faint text-sm hover:th-muted transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          Back to Profile
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl th-heading">{order.eventDetails?.eventName || 'Unnamed Event'}</h1>
            <p className="th-faint mt-1 text-sm">Order #{order.orderId} &middot; Placed {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-glass text-blue-300 border-blue-500/20 py-1.5 px-4">{formatStatus(order.orderStatus)}</span>
            <span className="badge-glass text-yellow-300 border-yellow-500/20 py-1.5 px-4">{formatStatus(order.orderPaymentStatus)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="glass-strong rounded-3xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-display font-bold text-lg th-heading mb-5">Order Summary</h3>
          <div className="space-y-3 mb-5">
            {order.menuItems.map((item) => (
              <div key={item.refId} className="glass rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold th-heading text-sm">{item.name}</h4>
                  <p className="text-xs th-ghost mt-0.5">Qty: {item.quantity} • {item.unit}</p>
                </div>
                <span className="text-sm font-bold th-heading">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="th-faint">Subtotal</span>
              <span className="th-heading font-medium">{formatCurrency(order.paymentDetails?.subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="th-faint">Tax</span>
              <span className="th-heading font-medium">{formatCurrency(order.paymentDetails?.tax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="th-faint">Fees</span>
              <span className="th-heading font-medium">{formatCurrency((order.paymentDetails?.serviceFee || 0) + (order.paymentDetails?.extraCharges || 0))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="th-faint">Paid</span>
              <span className="th-heading font-medium">{formatCurrency(order.paymentDetails?.amountPaid)}</span>
            </div>
            <div className="border-t border-black/5 dark:border-white/5 pt-3 flex justify-between">
              <span className="font-bold th-heading">Balance</span>
              <span className="text-xl font-bold gradient-text">{formatCurrency(order.paymentDetails?.remainingAmount)}</span>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-display font-bold text-lg th-heading mb-5">Event Details</h3>
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <p className="text-xs th-ghost mb-0.5">Date & Time</p>
              <p className="text-sm th-heading font-medium">{formatDate(order.eventDetails?.eventDateTime)}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs th-ghost mb-0.5">Service Type</p>
              <p className="text-sm th-heading font-medium capitalize">{order.eventDetails?.serviceType}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs th-ghost mb-0.5">Address</p>
              <p className="text-sm th-heading font-medium">{order.eventDetails?.deliveryAddress || 'Pickup at store'}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs th-ghost mb-0.5">Guests</p>
              <p className="text-sm th-heading font-medium">{order.eventDetails?.guestCount || 'N/A'}</p>
            </div>
            {order.eventDetails?.specialRequirements && (
              <div className="glass rounded-2xl p-4">
                <p className="text-xs th-ghost mb-0.5">Special Requirements</p>
                <p className="text-sm th-heading font-medium">{order.eventDetails.specialRequirements}</p>
              </div>
            )}
            {order.reviewFlags?.length > 0 && (
              <div className="glass rounded-2xl p-4">
                <p className="text-xs th-ghost mb-2">Review Notes</p>
                <div className="space-y-2">
                  {order.reviewFlags.map((flag) => (
                    <p key={flag.type} className="text-sm text-yellow-300">{flag.message}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        {canModify && (
          <button onClick={() => navigate(`/order-details?orderId=${order.orderRefId}`)} className="btn-ghost text-sm py-2.5 px-5 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Modify Order
          </button>
        )}
        {canCancel && (
          <button onClick={handleCancel} disabled={actionLoading} className="bg-black/5 dark:bg-white/5 border border-red-500/20 text-red-300 font-semibold rounded-2xl text-sm py-2.5 px-5 hover:bg-red-500/10 transition-all duration-300 inline-flex items-center gap-2 disabled:opacity-60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Cancel Order
          </button>
        )}
        {showPayButton && (
          <button onClick={handlePayNow} disabled={actionLoading} className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2 disabled:opacity-60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            {Number(order.paymentDetails?.amountPaid || 0) > 0 ? 'Pay Remaining Balance' : 'Pay Now'}
          </button>
        )}
      </div>

      <div className="glass rounded-3xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="font-display font-bold text-lg th-heading mb-4">Restaurant Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span className="text-sm th-muted">{order.storeDetails?.name || 'Steak n Shake Catering'}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span className="text-sm th-muted">{order.storeDetails?.phoneNumber || '(123) 456-7890'}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span className="text-sm th-muted">catering@nova.local</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span className="text-sm th-muted">{order.storeDetails?.address}</span>
          </div>
        </div>
      </div>
    </main>
  )
}
