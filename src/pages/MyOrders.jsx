import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const formatDate = (dateString) => {
  if (!dateString || dateString === 'Date not specified') return 'Date not specified'
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export default function MyOrders() {
  const [upcomingOrders, setUpcomingOrders] = useState([])
  const [pastOrders, setPastOrders] = useState([])
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
      ...order
    }))

    setUpcomingOrders(
      saved.filter(o => o.status !== 'Completed').sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
    )
    setPastOrders(
      saved.filter(o => o.status === 'Completed').sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
    )
  }, [])

  const viewOrderDetails = (orderId) => navigate(`/order-summary?id=${orderId}`)

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Page Header */}
      <div className="mb-10 animate-slide-up">
        <div className="inline-flex items-center gap-2 badge-glass text-primary-300 mb-4">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Order History
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl th-heading">My Orders</h1>
        <p className="th-faint mt-2">Track and manage all your catering orders</p>
      </div>

      <div className="glass-strong rounded-3xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="p-6 sm:p-8">
          {/* Upcoming Orders */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 className="font-display font-bold text-lg th-heading">Upcoming Orders</h2>
            </div>

            {upcomingOrders.length === 0 && (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                </div>
                <p className="th-faint text-sm">No upcoming orders</p>
                <Link to="/" className="inline-flex items-center gap-1 text-primary-400 text-sm font-medium mt-2 hover:text-primary-300 transition-colors">
                  Start a new order
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </Link>
              </div>
            )}

            <div className="space-y-3">
              {upcomingOrders.map(order => (
                <div key={order.id} className="glass rounded-2xl p-5 hover-card cursor-pointer group" onClick={() => viewOrderDetails(order.id)}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <div>
                        <h3 className="font-display font-bold th-heading group-hover:text-primary-300 transition-colors">{order.eventName}</h3>
                        <p className="text-sm th-faint mt-0.5">
                          {formatDate(order.eventDate)}
                          <span className="mx-2 th-ghost">&middot;</span>
                          <span className="font-semibold th-muted">{formatCurrency(order.total)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge-glass text-blue-300 border-blue-500/20">{order.status}</span>
                      <svg className="w-4 h-4 th-ghost group-hover:th-faint transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Orders */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                <svg className="w-4 h-4 th-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="font-display font-bold text-lg th-body">Past Orders</h2>
            </div>

            {pastOrders.length === 0 && (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="th-ghost text-sm">No past orders yet</p>
              </div>
            )}

            <div className="space-y-3">
              {pastOrders.map(order => (
                <div key={order.id} className="glass rounded-2xl p-5 hover-card cursor-pointer group opacity-70 hover:opacity-100 transition-opacity" onClick={() => viewOrderDetails(order.id)}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <div>
                        <h3 className="font-display font-bold th-body group-hover:th-heading transition-colors">{order.eventName}</h3>
                        <p className="text-sm th-ghost mt-0.5">
                          {formatDate(order.eventDate)}
                          <span className="mx-2 th-ghost">&middot;</span>
                          <span className="font-semibold th-muted">{formatCurrency(order.total)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge-glass text-green-300 border-green-500/20">{order.status}</span>
                      <svg className="w-4 h-4 th-ghost group-hover:th-ghost transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
