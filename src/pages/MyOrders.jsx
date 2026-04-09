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

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('all')
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
  }, [])

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') return order.status !== 'Completed'
    return order.status === 'Completed'
  })

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <div className="animate-slide-up">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full glass flex items-center justify-center th-muted hover:th-heading transition-colors mb-8">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="glass rounded-[28px] p-1.5 inline-flex items-center gap-1 w-fit">
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
                  className={`min-w-[154px] px-6 py-3 rounded-[22px] text-base font-medium transition-all ${active ? 'bg-primary-700 text-white shadow-[0_12px_30px_rgba(199,33,41,0.22)]' : 'th-muted hover:th-heading'}`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <button onClick={() => navigate('/')} className="btn-primary text-base py-3 px-8 rounded-[24px] inline-flex items-center justify-center w-full lg:w-auto">
            Place New Order
          </button>
        </div>

        <div className="space-y-5">
          {filteredOrders.length === 0 && (
            <div className="glass-strong rounded-[32px] p-10 text-center">
              <p className="text-lg th-muted">No orders found for this filter.</p>
            </div>
          )}

          {filteredOrders.map(order => {
            const itemCount = order.cart.reduce((sum, item) => sum + item.quantity, 0)
            const dueDate = order.eventDate
            const orderedOn = order.placedDate
            const serviceLabel = order.serviceType === 'pickup' ? 'Pick-up' : 'Delivery'

            return (
              <button
                key={order.id}
                onClick={() => navigate(`/order-summary?id=${order.id}`)}
                className="w-full text-left glass-strong rounded-[32px] p-8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all"
              >
                <div className="mb-5">
                  <h2 className="text-[28px] font-bold tracking-tight th-heading">{groupLabel(order.eventDate)}</h2>
                  <p className="text-[17px] th-muted mt-2">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                    <span className="mx-3 th-ghost">&bull;</span>
                    {formatCurrency(order.total)}
                  </p>
                </div>

                <div className="border-t border-black/6 dark:border-white/6 pt-5">
                  <div className="glass rounded-[26px] px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div>
                      <p className="text-sm th-muted mb-2">Order ID</p>
                      <p className="text-[18px] font-semibold th-heading">#{String(order.id).replace('order_', '').slice(-7)}</p>
                    </div>
                    <div>
                      <p className="text-sm th-muted mb-2">Ordered on</p>
                      <p className="text-[18px] font-semibold th-heading">{formatShortDate(orderedOn)} <span className="mx-2 th-ghost">&bull;</span> {formatTime(orderedOn)}</p>
                    </div>
                    <div>
                      <p className="text-sm th-muted mb-2">Due on</p>
                      <p className="text-[18px] font-semibold th-heading">{formatShortDate(dueDate)} <span className="mx-2 th-ghost">&bull;</span> {formatTime(dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm th-muted mb-2">Type</p>
                      <p className="text-[18px] font-semibold th-heading">{serviceLabel}</p>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
