import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const formatDate = (dateString) => {
  if (!dateString) return 'Date not specified'
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export default function OrderSummary() {
  const [order, setOrder] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    window.scrollTo(0, 0)
    const orderId = searchParams.get('id')
    if (!orderId) return
    const orders = JSON.parse(localStorage.getItem('snsAppOrders') || '[]')
    const found = orders.find(o => o.id === orderId)
    if (found) setOrder(found)
  }, [searchParams])

  if (!order) {
    return (
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="text-center py-20">
          <p className="th-muted">Order not found</p>
          <Link to="/my-orders" className="text-primary-400 text-sm font-medium mt-2 inline-block hover:text-primary-300 transition-colors">Back to My Orders</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Page Header with Status */}
      <div className="mb-10 animate-slide-up">
        <Link to="/my-orders" className="inline-flex items-center gap-1 th-faint text-sm hover:th-muted transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          Back to My Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl th-heading">{order.eventName}</h1>
            <p className="th-faint mt-1 text-sm">Order #{order.id} &middot; Placed {formatDate(order.placedDate)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-glass text-green-300 border-green-500/20 py-1.5 px-4">{order.status}</span>
            <span className="badge-glass text-yellow-300 border-yellow-500/20 py-1.5 px-4">{order.paymentStatus}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Order Summary */}
        <div className="glass-strong rounded-3xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-display font-bold text-lg th-heading mb-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            Order Summary
          </h3>
          <div className="space-y-3 mb-5">
            {order.cart.map((item, i) => (
              <div key={i} className="glass rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold th-heading text-sm">{item.name}</h4>
                  <p className="text-xs th-ghost mt-0.5">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-bold th-heading">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="th-faint">Subtotal</span>
              <span className="th-heading font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="th-faint">Tax (10%)</span>
              <span className="th-heading font-medium">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="th-faint">Delivery Fee</span>
              <span className="th-heading font-medium">{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="border-t border-black/5 dark:border-white/5 pt-3 flex justify-between">
              <span className="font-bold th-heading">Total</span>
              <span className="text-xl font-bold gradient-text">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="glass-strong rounded-3xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-display font-bold text-lg th-heading mb-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            Event Details
          </h3>
          <div className="space-y-4">
            {[
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>, label: 'Date & Time', value: formatDate(order.eventDate) },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>, label: 'Service Type', value: order.serviceType, capitalize: true },
              { icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></>, label: 'Address', value: order.deliveryAddress || 'N/A' },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>, label: 'Guests', value: order.guestCount || 'N/A' },
            ].map((detail, i) => (
              <div key={i} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{detail.icon}</svg>
                  <div>
                    <p className="text-xs th-ghost mb-0.5">{detail.label}</p>
                    <p className={`text-sm th-heading font-medium ${detail.capitalize ? 'capitalize' : ''}`}>{detail.value}</p>
                  </div>
                </div>
              </div>
            ))}
            {order.specialRequirements && (
              <div className="glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                  <div>
                    <p className="text-xs th-ghost mb-0.5">Special Requirements</p>
                    <p className="text-sm th-heading font-medium">{order.specialRequirements}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <button className="btn-ghost text-sm py-2.5 px-5 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Modify Order
        </button>
        <button className="bg-black/5 dark:bg-white/5 border border-red-500/20 text-red-300 font-semibold rounded-2xl text-sm py-2.5 px-5 hover:bg-red-500/10 transition-all duration-300 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Cancel Order
        </button>
        {order.paymentStatus === 'Unpaid' && (
          <button className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            Pay Now
          </button>
        )}
      </div>

      {/* Restaurant Contact */}
      <div className="glass rounded-3xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="font-display font-bold text-lg th-heading mb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
            <svg className="w-4 h-4 th-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          Restaurant Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span className="text-sm th-muted">Steak 'n Shake</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span className="text-sm th-muted">(123) 456-7890</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span className="text-sm th-muted">info@steaknshake.com</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span className="text-sm th-muted">2410 Blvd Ste 150, San Ramon, CA 94583</span>
          </div>
        </div>
      </div>
    </main>
  )
}
