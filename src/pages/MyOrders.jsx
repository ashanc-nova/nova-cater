import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { useCatering } from '../context/CateringContext'

const formatDate = (dateString) => {
  if (!dateString) return 'Date not specified'
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)

const formatStatus = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const PAST_ORDER_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'REJECTED'])

export default function MyOrders() {
  const navigate = useNavigate()
  const { auth, isAuthenticated, fetchOrders, ordersLoading, logout } = useCatering()
  const [activeTab, setActiveTab] = useState('orders')
  const [upcomingOrders, setUpcomingOrders] = useState([])
  const [pastOrders, setPastOrders] = useState([])
  const [error, setError] = useState('')

  const loadOrders = async () => {
    try {
      const response = await fetchOrders({ recsPerPage: 20, pageNo: 1 })
      const records = response.records || []
      setUpcomingOrders(records.filter((order) => !PAST_ORDER_STATUSES.has(order.orderStatus)))
      setPastOrders(records.filter((order) => PAST_ORDER_STATUSES.has(order.orderStatus)))
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to load your orders.')
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders()
    }
  }, [isAuthenticated])

  const viewOrderDetails = (orderId) => navigate(`/order-summary?id=${orderId}`)

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <div className="mb-10 animate-slide-up">
        <div className="inline-flex items-center gap-2 badge-glass text-primary-300 mb-4">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Account
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl th-heading">Profile</h1>
        <p className="th-faint mt-2">Manage your account and catering orders in one place.</p>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === 'orders' ? 'bg-primary-500 text-white' : 'glass th-muted hover:th-heading'
          }`}
        >
          My Orders
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === 'profile' ? 'bg-primary-500 text-white' : 'glass th-muted hover:th-heading'
          }`}
        >
          Profile
        </button>
      </div>

      {!isAuthenticated ? (
        <AuthCard
          title="Sign In"
          description="Enter your mobile number to continue. You can verify with OTP or continue as guest."
          onAuthenticated={loadOrders}
        />
      ) : activeTab === 'profile' ? (
        <div className="glass-strong rounded-3xl p-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500/25 to-primary-700/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold gradient-text">
                  {(auth.profile?.firstName || 'N').slice(0, 1).toUpperCase()}
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl th-heading">
                {[auth.profile?.firstName, auth.profile?.lastName].filter(Boolean).join(' ') || 'NOVA Customer'}
              </h2>
              <p className="th-faint mt-2">Your account is ready for catering orders and order tracking.</p>
            </div>
            <button onClick={logout} className="btn-ghost text-sm py-2.5 px-5 self-start">
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="glass rounded-2xl p-5">
              <p className="text-xs th-ghost mb-1">Mobile</p>
              <p className="text-sm font-semibold th-heading">
                {auth.profile?.countryCode || '+1'} {auth.profile?.mobileNumber || 'Not available'}
              </p>
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="text-xs th-ghost mb-1">Email</p>
              <p className="text-sm font-semibold th-heading">
                {auth.profile?.emailAddress || 'Not provided'}
              </p>
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="text-xs th-ghost mb-1">Orders</p>
              <p className="text-sm font-semibold th-heading">
                {upcomingOrders.length + pastOrders.length} total
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-strong rounded-3xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-6 sm:p-8">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h2 className="font-display font-bold text-lg th-heading">Upcoming Orders</h2>
              </div>

              {ordersLoading ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="th-faint text-sm">Loading your catering orders...</p>
                </div>
              ) : upcomingOrders.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="th-faint text-sm">No upcoming orders</p>
                  <Link to="/" className="inline-flex items-center gap-1 text-primary-400 text-sm font-medium mt-2 hover:text-primary-300 transition-colors">
                    Start a new order
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingOrders.map(order => (
                    <div key={order.orderRefId} className="glass rounded-2xl p-5 hover-card cursor-pointer group" onClick={() => viewOrderDetails(order.orderRefId)}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          </div>
                          <div>
                            <h3 className="font-display font-bold th-heading group-hover:text-primary-300 transition-colors">{order.eventDetails?.eventName || 'Unnamed Event'}</h3>
                            <p className="text-sm th-faint mt-0.5">
                              {formatDate(order.eventDetails?.eventDateTime)}
                              <span className="mx-2 th-ghost">&middot;</span>
                              <span className="font-semibold th-muted">{formatCurrency(order.paymentDetails?.grandTotal)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="badge-glass text-blue-300 border-blue-500/20">{formatStatus(order.orderStatus)}</span>
                          <svg className="w-4 h-4 th-ghost group-hover:th-faint transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <svg className="w-4 h-4 th-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h2 className="font-display font-bold text-lg th-body">Past Orders</h2>
              </div>

              {pastOrders.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="th-ghost text-sm">No past orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastOrders.map(order => (
                    <div key={order.orderRefId} className="glass rounded-2xl p-5 hover-card cursor-pointer group opacity-70 hover:opacity-100 transition-opacity" onClick={() => viewOrderDetails(order.orderRefId)}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 th-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"/></svg>
                          </div>
                          <div>
                            <h3 className="font-display font-bold th-body group-hover:th-heading transition-colors">{order.eventDetails?.eventName || 'Unnamed Event'}</h3>
                            <p className="text-sm th-ghost mt-0.5">
                              {formatDate(order.eventDetails?.eventDateTime)}
                              <span className="mx-2 th-ghost">&middot;</span>
                              <span className="font-semibold th-muted">{formatCurrency(order.paymentDetails?.grandTotal)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="badge-glass text-green-300 border-green-500/20">{formatStatus(order.orderStatus)}</span>
                          <svg className="w-4 h-4 th-ghost group-hover:th-ghost transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
