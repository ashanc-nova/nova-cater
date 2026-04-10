import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatShortDate = (dateString) => {
  if (!dateString || dateString === 'Date not specified') return 'Date not specified'
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (dateString) => {
  if (!dateString || dateString === 'Date not specified') return '--'
  const date = new Date(dateString)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const groupLabel = (dateString) => {
  if (!dateString || dateString === 'Date not specified') return 'Upcoming order'
  const date = new Date(dateString)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const prefix = isToday ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long' })
  return `${prefix}, ${formatShortDate(dateString)}`
}

const normalizePhone = (value) => String(value || '').replace(/\D/g, '')

const normalizedOrderRef = (orderId) => String(orderId || '').replace('order_', '')

const isUpcomingOrder = (order) => {
  if (order.status === 'Completed') return false
  if (!order.eventDate || order.eventDate === 'Date not specified') return true
  return new Date(order.eventDate) >= new Date()
}

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [trustedOrderIds, setTrustedOrderIds] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [otpOrder, setOtpOrder] = useState(null)
  const [otpValue, setOtpValue] = useState('')
  const [otpError, setOtpError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
    let saved = JSON.parse(localStorage.getItem('snsAppOrders') || '[]')
    saved = saved.map((order, index) => ({
      id: order.id || `order_${Date.now()}_${index}`,
      eventName: order.eventName || 'Unnamed Event',
      eventDate: order.eventDate || 'Date not specified',
      total: order.total || 0,
      status: order.status || 'Confirmed',
      serviceType: order.serviceType || 'delivery',
      cart: order.cart || [],
      placedDate: order.placedDate || order.eventDate || new Date().toISOString(),
      ...order,
    })).sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))

    setOrders(saved)

    const persistedTrustedIds = JSON.parse(localStorage.getItem('snsTrustedOrderIds') || '[]')
    if (persistedTrustedIds.length > 0) {
      setTrustedOrderIds(persistedTrustedIds)
    } else {
      const seededIds = saved.map(order => order.id)
      localStorage.setItem('snsTrustedOrderIds', JSON.stringify(seededIds))
      setTrustedOrderIds(seededIds)
    }
  }, [])

  const matchesOrderLookup = (order, rawQuery) => {
    const query = rawQuery.trim().toLowerCase()
    if (!query) return true

    const normalizedQueryPhone = normalizePhone(query)
    const orderRef = normalizedOrderRef(order.id)
    const shortOrderRef = orderRef.slice(-7)
    const searchableFields = [
      orderRef.toLowerCase(),
      `#${shortOrderRef}`.toLowerCase(),
      String(order.customerEmail || '').toLowerCase(),
      String(order.customerPhone || '').toLowerCase(),
    ]

    const textMatch = searchableFields.some(field => field.includes(query))
    const phoneMatch = normalizedQueryPhone.length > 0 && normalizePhone(order.customerPhone).includes(normalizedQueryPhone)

    return textMatch || phoneMatch
  }

  const trustedOrders = orders.filter(order => trustedOrderIds.includes(order.id))

  const filteredOrders = trustedOrders.filter(order => {
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') return isUpcomingOrder(order)
    return !isUpcomingOrder(order)
  })

  const lookupResults = searchQuery.trim()
    ? orders.filter(order => !trustedOrderIds.includes(order.id) && matchesOrderLookup(order, searchQuery))
    : []

  const unlockOrderForDevice = (orderId) => {
    const nextTrustedIds = trustedOrderIds.includes(orderId) ? trustedOrderIds : [orderId, ...trustedOrderIds]
    setTrustedOrderIds(nextTrustedIds)
    localStorage.setItem('snsTrustedOrderIds', JSON.stringify(nextTrustedIds))
  }

  const openOrder = (order) => {
    if (trustedOrderIds.includes(order.id)) {
      navigate(`/order-summary?id=${order.id}`)
      return
    }

    setOtpOrder(order)
    setOtpValue('')
    setOtpError('')
  }

  const verifyOrderOtp = () => {
    if (!/^\d{4}$/.test(otpValue)) {
      setOtpError('Enter the 4-digit OTP to open this order on this device.')
      return
    }

    unlockOrderForDevice(otpOrder.id)
    setOtpOrder(null)
    setOtpValue('')
    setOtpError('')
    setSearchQuery('')
    navigate(`/order-summary?id=${otpOrder.id}`)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
      <div className="animate-slide-up">
        <div className="flex items-center justify-between gap-3 mb-6 md:mb-8">
          <button onClick={() => navigate('/')} className="w-12 h-12 rounded-full glass flex items-center justify-center th-muted hover:th-heading transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="w-12 h-12 rounded-full glass flex items-center justify-center th-muted hover:th-heading transition-colors shrink-0 lg:hidden"
            aria-label="Search orders"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"/></svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="glass rounded-[28px] p-1.5 inline-flex items-center gap-1 w-full md:w-fit overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-w-[112px] md:min-w-[154px] px-4 md:px-6 py-3 rounded-[22px] text-sm md:text-base font-medium transition-all ${active ? 'bg-primary-700 text-white shadow-[0_12px_30px_rgba(199,33,41,0.22)]' : 'th-muted hover:th-heading'}`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <button onClick={() => setSearchOpen(true)} className="hidden lg:inline-flex btn-primary text-base py-3 px-8 rounded-[24px] items-center justify-center w-full lg:w-auto">
            Search
          </button>
        </div>

        {searchOpen && (
          <div className="glass-strong rounded-[24px] md:rounded-[30px] p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold th-heading">Search an order</h2>
                <p className="text-xs md:text-sm th-muted mt-1">Look up orders using a phone number, email address, or order ID.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[540px]">
                <label className="glass-input rounded-2xl px-4 py-3 flex items-center gap-3 flex-1">
                  <svg className="w-4 h-4 th-faint shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"/></svg>
                  <input
                    className="bg-transparent outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent text-sm w-full th-heading placeholder:th-faint"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Phone number, email, or order ID"
                    autoFocus
                  />
                </label>
                <button
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchQuery('')
                  }}
                  className="px-4 py-3 rounded-2xl border border-black/8 dark:border-white/10 text-sm font-medium th-muted hover:th-heading transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {lookupResults.length > 0 && (
            <div className="glass-strong rounded-[32px] p-6 md:p-7">
              <div className="mb-5">
                <h2 className="text-xl font-semibold th-heading">Matching orders from other devices</h2>
                <p className="text-sm th-muted mt-1">Open one with a 4-digit OTP and it will stay in My Orders on this device.</p>
              </div>

              <div className="space-y-4">
                {lookupResults.map(order => {
                  const itemCount = order.cart.reduce((sum, item) => sum + item.quantity, 0)
                  return (
                    <button
                      key={`lookup_${order.id}`}
                      onClick={() => openOrder(order)}
                      className="w-full text-left glass rounded-[24px] md:rounded-[28px] p-4 md:p-5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold th-heading">#{normalizedOrderRef(order.id).slice(-7)}</p>
                          <p className="text-sm th-muted mt-1">{order.customerPhone || order.customerEmail || 'Guest order lookup'}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-base font-semibold th-heading">{formatCurrency(order.total)}</p>
                          <p className="text-sm th-muted mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''} • {formatShortDate(order.eventDate)}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="glass-strong rounded-[32px] p-10 text-center">
              <p className="text-lg th-muted">
                {searchQuery
                  ? lookupResults.length > 0
                    ? 'Unlock a matching order above to add it to My Orders on this device.'
                    : 'No orders matched that phone number, email, or order ID.'
                  : 'No orders found for this filter.'}
              </p>
            </div>
          )}

          {filteredOrders.map(order => {
            const dueDate = order.eventDate
            const serviceLabel = order.serviceType === 'pickup' ? 'Pick-up' : 'Delivery'
            const isCompleted = order.status === 'Completed'
            const statusDotClass = isCompleted ? 'bg-amber-500' : 'bg-emerald-500'
            const statusLabel = isCompleted ? 'Completed order' : 'Upcoming order'

            return (
              <button
                key={order.id}
                onClick={() => openOrder(order)}
                className="w-full text-left glass-strong rounded-[24px] md:rounded-[32px] p-4 md:p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                  <h2 className="text-lg md:text-2xl font-semibold tracking-tight th-heading">
                    {order.eventName || 'Unnamed Event'}
                  </h2>
                  <span className={`w-3 h-3 rounded-full ${statusDotClass}`} aria-label={statusLabel} title={statusLabel} />
                </div>

                <div className="glass rounded-[20px] md:rounded-[26px] px-4 md:px-5 py-4 md:py-5 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4">
                  <div>
                    <p className="text-xs md:text-sm th-muted mb-1.5">Order ID</p>
                    <p className="text-base md:text-[18px] font-semibold th-heading">#{String(order.id).replace('order_', '').slice(-7)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm th-muted mb-1.5">Date &amp; time</p>
                    <p className="text-base md:text-[18px] font-semibold th-heading">{formatShortDate(dueDate)} <span className="mx-2 th-ghost">&bull;</span> {formatTime(dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm th-muted mb-1.5">Total</p>
                    <p className="text-base md:text-[18px] font-semibold th-heading">{formatCurrency(order.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm th-muted mb-1.5">Type</p>
                    <p className="text-base md:text-[18px] font-semibold th-heading">{serviceLabel}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {otpOrder && (
        <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-md glass-strong rounded-[32px] p-6 md:p-7 animate-slide-up">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold th-heading">Verify this order</h2>
                <p className="text-sm th-muted mt-2">Enter the 4-digit OTP to open order #{normalizedOrderRef(otpOrder.id).slice(-7)} on this device.</p>
              </div>
              <button onClick={() => setOtpOrder(null)} className="w-10 h-10 rounded-full glass flex items-center justify-center th-muted hover:th-heading transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <label className="block">
              <span className="block text-sm th-muted mb-2">4-digit OTP</span>
              <input
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-lg tracking-[0.35em] text-center"
                value={otpValue}
                onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                placeholder="0000"
                autoFocus
              />
            </label>

            {otpError && <p className="text-sm text-rose-500 mt-3">{otpError}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setOtpOrder(null)} className="flex-1 px-4 py-3 rounded-2xl border border-black/8 dark:border-white/10 text-sm font-medium th-muted hover:th-heading transition-colors">
                Cancel
              </button>
              <button onClick={verifyOrderOtp} className="flex-1 btn-primary text-sm py-3 rounded-2xl">
                Verify OTP
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
