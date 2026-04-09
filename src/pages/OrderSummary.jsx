import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const formatDateTime = (dateString) => {
  if (!dateString || dateString === 'Date not specified') return 'Date not specified'
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatDate = (dateString) => {
  if (!dateString || dateString === 'Date not specified') return 'Date not specified'
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (dateString) => {
  if (!dateString || dateString === 'Date not specified') return '--'
  return new Date(dateString).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export default function OrderSummary() {
  const [order, setOrder] = useState(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setCart } = useCart()

  const persistOrderUpdate = (updatedOrder) => {
    const orders = JSON.parse(localStorage.getItem('snsAppOrders') || '[]')
    const nextOrders = orders.map(existing => existing.id === updatedOrder.id ? updatedOrder : existing)
    localStorage.setItem('snsAppOrders', JSON.stringify(nextOrders))
    setOrder(updatedOrder)
  }

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

  const modifyOrder = () => {
    const restoredCart = order.cart || []
    localStorage.setItem('snsAppCart', JSON.stringify(restoredCart))
    setCart(restoredCart)
    localStorage.setItem('snsAppEventDetails', JSON.stringify({
      eventName: order.eventName || '',
      eventDateTime: order.eventDate && order.eventDate !== 'Date not specified' ? order.eventDate : '',
      serviceType: order.serviceType || 'delivery',
      deliveryAddress: order.deliveryAddress || '',
      deliveryInstructions: order.deliveryInstructions || '',
      guestCount: order.guestCount || '',
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      specialRequirements: order.specialRequirements || '',
    }))
    navigate('/')
  }

  const cancelOrder = () => {
    const updatedOrder = {
      ...order,
      status: 'Cancelled',
      paymentStatus: order.paymentStatus === 'Paid' ? 'Refund Pending' : 'Cancelled',
    }
    persistOrderUpdate(updatedOrder)
    navigate('/my-orders')
  }

  const payNow = () => {
    const updatedOrder = {
      ...order,
      paymentStatus: 'Paid',
      depositAmount: order.total || order.depositAmount || 0,
    }
    persistOrderUpdate(updatedOrder)
  }

  const isFullyPaid = order.paymentStatus === 'Paid'
  const paymentTone = isFullyPaid
    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
    : order.paymentStatus === 'Partially Paid'
      ? 'bg-primary-500/15 text-primary-500 border-primary-500/30'
      : 'bg-rose-500/15 text-rose-500 border-rose-500/30'

  const statusTone = order.status === 'Confirmed'
    ? 'bg-primary-500/15 text-primary-500 border-primary-500/30'
    : 'bg-sky-500/15 text-sky-500 border-sky-500/30'

  const summaryRows = [
    { label: 'Subtotal', value: formatCurrency(order.subtotal || 0) },
    { label: 'Tax', value: formatCurrency(order.tax || 0) },
    { label: 'Service fee', value: formatCurrency((order.serviceFee ?? order.deliveryFee) || 0) },
  ]

  if (order.depositAmount) {
    summaryRows.push({ label: 'Paid now', value: formatCurrency(order.depositAmount) })
  }

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <div className="animate-slide-up">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full glass flex items-center justify-center th-muted hover:th-heading transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className={`px-4 py-2 rounded-full border text-sm font-semibold ${statusTone}`}>{order.status}</span>
            <span className={`px-4 py-2 rounded-full border text-sm font-semibold ${paymentTone}`}>{order.paymentStatus}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)] gap-8 items-start">
          <section className="glass-strong rounded-[32px] p-6 md:p-7">
            <div className="glass rounded-[28px] p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full glass flex items-center justify-center">
                    <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  </div>
                  <div>
                    <p className="text-sm th-muted mb-1">Order ID</p>
                    <p className="text-[18px] font-semibold th-heading">#{String(order.id).replace('order_', '').slice(-7)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full glass flex items-center justify-center">
                    <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-sm th-muted mb-1">Date &amp; time</p>
                    <p className="text-[18px] font-semibold th-heading">{formatDateTime(order.eventDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-[28px] p-6 mb-6">
              <div className="space-y-0">
                {[
                  { label: 'Service Type', value: order.serviceType === 'pickup' ? 'Pickup' : 'Delivery', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>, extra: null },
                  { label: 'Address', value: order.deliveryAddress || 'Pickup', icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></>, extra: order.deliveryInstructions ? `Instructions: ${order.deliveryInstructions}` : null },
                  { label: 'Contact Detail', value: order.customerEmail || 'N/A', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>, extra: order.customerName || null },
                  { label: 'Guest Count', value: order.guestCount || 'N/A', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A6.97 6.97 0 0112 15a6.97 6.97 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"/> , extra: order.specialRequirements || null },
                ].map((detail, index) => (
                  <div key={detail.label} className={`flex items-start gap-4 py-5 ${index !== 3 ? 'border-b border-dashed border-black/8 dark:border-white/8' : ''}`}>
                    <div className="w-12 h-12 rounded-full glass flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">{detail.icon}</svg>
                    </div>
                    <div>
                      <p className="text-sm th-muted mb-1">{detail.label}</p>
                      <p className="text-[18px] font-semibold th-heading">{detail.value}</p>
                      {detail.extra && <p className="text-sm th-muted mt-1">{detail.extra}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-black/8 dark:border-white/8 mt-3 pt-6">
                <div className="flex flex-wrap gap-5 text-[18px] font-semibold">
                  <button onClick={modifyOrder} className="text-primary-500 hover:text-primary-400 transition-colors">
                    Modify Order
                  </button>
                  <button onClick={cancelOrder} className="text-rose-500 hover:text-rose-400 transition-colors">
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>

            <div className="glass rounded-[28px] p-6">
              <h3 className="text-[22px] font-bold tracking-tight th-heading mb-4">Restaurant Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  <span className="text-sm th-muted">SNS</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span className="text-sm th-muted">(123) 456-7890</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span className="text-sm th-muted">info@sns.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span className="text-sm th-muted">2410 Blvd Ste 150, San Ramon, CA 94583</span>
                </div>
              </div>
            </div>
          </section>

          <aside className="glass-strong rounded-[32px] p-6 md:p-7">
            <h2 className="text-[28px] font-bold tracking-tight th-heading mb-5">Order Summary</h2>

            <div className="glass rounded-[28px] p-5 mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center">
                  <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <h3 className="text-[22px] font-bold tracking-tight th-heading">Items</h3>
              </div>

              <div className="space-y-5">
                {order.cart.map((item, index) => (
                  <div key={index} className="pb-5 border-b border-black/6 dark:border-white/6 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[18px] font-semibold th-heading leading-snug">{item.quantity} × {item.name}</p>
                            <p className="th-muted text-sm mt-1">{item.unit}{item.selectedModifiers?.length ? `, ${item.selectedModifiers.join(', ')}` : ''}</p>
                          </div>
                          <span className="text-lg font-semibold th-heading whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[28px] p-5">
              <div className="space-y-3 pb-5 border-b border-dashed border-black/10 dark:border-white/10">
                {summaryRows.map(row => (
                  <div key={row.label} className="flex items-center justify-between text-base">
                    <span className="th-muted">{row.label}</span>
                    <span className="th-heading font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-5">
                <span className="text-[28px] font-bold tracking-tight th-heading">Total</span>
                <span className="text-[30px] font-bold tracking-tight gradient-text">{formatCurrency(order.total || 0)}</span>
              </div>
            </div>

            {!isFullyPaid && (
              <button onClick={payNow} className="w-full btn-primary text-base py-4 mt-5 flex items-center justify-center gap-3 rounded-[28px]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                Pay Now
              </button>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
