import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export default function OrderDetails() {
  const { cart, clearCart } = useCart()
  const navigate = useNavigate()

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [serviceType, setServiceType] = useState('delivery')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [paymentOption, setPaymentOption] = useState('pay-later')
  const [depositAmount, setDepositAmount] = useState(0)

  const eventDateTime = eventDate && eventTime ? `${eventDate}T${eventTime}` : ''

  useEffect(() => {
    window.scrollTo(0, 0)
    const saved = JSON.parse(localStorage.getItem('snsAppEventDetails') || '{}')
    setEventName(saved.eventName || '')
    if (saved.eventDateTime) {
      const [d, t] = saved.eventDateTime.split('T')
      setEventDate(d || '')
      setEventTime(t || '')
    }
    const savedService = saved.serviceType && saved.serviceType !== 'dineIn' ? saved.serviceType : 'delivery'
    setServiceType(savedService)
    setDeliveryAddress(saved.deliveryAddress || '')
    setGuestCount(saved.guestCount || '')
    setSpecialRequirements(saved.specialRequirements || '')
  }, [])

  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = cartSubtotal * 0.1
  const deliveryFee = serviceType === 'delivery' ? 10 : 0
  const total = cartSubtotal + tax + deliveryFee

  const saveEventDetails = () => {
    localStorage.setItem('snsAppEventDetails', JSON.stringify({
      eventName, eventDateTime, serviceType, deliveryAddress, guestCount, specialRequirements
    }))
  }

  const editOrder = () => {
    saveEventDetails()
    navigate('/')
  }

  const placeOrder = () => {
    const orderId = 'order_' + Date.now()
    const orderDetails = {
      id: orderId,
      eventName: eventName || 'Unnamed Event',
      eventDate: eventDateTime || 'Date not specified',
      serviceType, deliveryAddress, guestCount, specialRequirements,
      cart, subtotal: cartSubtotal, tax, deliveryFee, total,
      paymentOption, depositAmount,
      status: 'Confirmed',
      paymentStatus: paymentOption === 'pay-later' ? 'Unpaid' : 'Paid',
      placedDate: new Date().toISOString()
    }

    let orders = JSON.parse(localStorage.getItem('snsAppOrders') || '[]')
    orders.unshift(orderDetails)
    localStorage.setItem('snsAppOrders', JSON.stringify(orders))

    clearCart()
    localStorage.removeItem('snsAppEventDetails')
    navigate('/my-orders')
  }

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      {/* Page Header */}
      <div className="mb-10 animate-slide-up">
        <div className="inline-flex items-center gap-2 badge-glass text-primary-300 mb-4">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Order Details
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl th-heading">Finalize Your Order</h1>
        <p className="th-faint mt-2">Fill in your event details and review your order</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Section */}
        <div className="w-full lg:w-2/3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-strong rounded-3xl p-8">
            <h2 className="font-display font-bold text-xl th-heading mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              Event Details
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block th-muted text-sm font-medium mb-2" htmlFor="eventName">Event Name</label>
                <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" id="eventName" type="text" placeholder="e.g., Annual Team Dinner" value={eventName} onChange={e => setEventName(e.target.value)}/>
              </div>

              <div>
                <label className="block th-muted text-sm font-medium mb-3">Event Date &amp; Time</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <div className="w-9 h-9 rounded-xl bg-primary-500/15 flex items-center justify-center group-focus-within:bg-primary-500/25 transition-colors">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                    </div>
                    <input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="glass-input w-full pl-16 pr-4 py-4 rounded-2xl text-sm font-medium th-heading focus:ring-2 focus:ring-primary-500/40 transition-all"
                    />
                    <span className="absolute -top-2 left-14 px-2 text-[10px] font-semibold uppercase tracking-wider th-faint bg-[var(--surface-bg,transparent)]">Date</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <div className="w-9 h-9 rounded-xl bg-primary-500/15 flex items-center justify-center group-focus-within:bg-primary-500/25 transition-colors">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </div>
                    </div>
                    <input
                      id="eventTime"
                      type="time"
                      value={eventTime}
                      onChange={e => setEventTime(e.target.value)}
                      className="glass-input w-full pl-16 pr-4 py-4 rounded-2xl text-sm font-medium th-heading focus:ring-2 focus:ring-primary-500/40 transition-all"
                    />
                    <span className="absolute -top-2 left-14 px-2 text-[10px] font-semibold uppercase tracking-wider th-faint bg-[var(--surface-bg,transparent)]">Time</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block th-muted text-sm font-medium mb-3">Service Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'delivery', label: 'Delivery', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/> },
                    { value: 'pickup', label: 'Pickup', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/> },
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer">
                      <input type="radio" name="serviceType" value={opt.value} checked={serviceType === opt.value} onChange={e => setServiceType(e.target.value)} className="hidden peer"/>
                      <div className="glass rounded-2xl p-4 text-center transition-all duration-300 peer-checked:bg-primary-500/20 peer-checked:border-primary-500/40 border border-transparent hover:bg-black/5 dark:hover:bg-white/5">
                        <svg className="w-6 h-6 mx-auto mb-2 th-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">{opt.icon}</svg>
                        <span className="text-xs font-semibold th-muted">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {serviceType === 'delivery' && (
                <div>
                  <label className="block th-muted text-sm font-medium mb-2" htmlFor="deliveryAddress">Delivery Address</label>
                  <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" id="deliveryAddress" type="text" placeholder="Enter delivery address" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}/>
                </div>
              )}

              <div>
                <label className="block th-muted text-sm font-medium mb-2" htmlFor="guestCount">Number of Guests</label>
                <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" id="guestCount" type="number" placeholder="How many guests?" value={guestCount} onChange={e => setGuestCount(e.target.value)}/>
              </div>

              <div>
                <label className="block th-muted text-sm font-medium mb-2" htmlFor="specialRequirements">Special Requirements</label>
                <textarea className="glass-input w-full py-3 px-4 rounded-2xl text-sm resize-none" id="specialRequirements" rows="3" placeholder="Allergies, dietary needs, setup preferences..." value={specialRequirements} onChange={e => setSpecialRequirements(e.target.value)}/>
              </div>
            </div>
          </div>
        </div>

        {/* Order Review Sidebar */}
        <div className="w-full lg:w-1/3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="lg:sticky lg:top-28">
            <div className="glass-strong rounded-3xl p-6">
              <h2 className="font-display font-bold text-xl th-heading mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                Review Order
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold th-heading text-sm truncate">{item.name}</h3>
                      <p className="text-xs th-faint">Qty: {item.quantity} x {item.unit} &middot; Serves {item.serves * item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold th-heading ml-3">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-black/5 dark:border-white/5 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="th-faint">Subtotal</span>
                  <span className="th-heading font-medium">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="th-faint">Tax (10%)</span>
                  <span className="th-heading font-medium">{formatCurrency(tax)}</span>
                </div>
                {serviceType === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="th-faint">Delivery Fee</span>
                    <span className="th-heading font-medium">{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                <div className="border-t border-black/5 dark:border-white/5 pt-3 flex justify-between">
                  <span className="font-bold th-heading">Total</span>
                  <span className="text-xl font-bold gradient-text">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Edit Order */}
              <button onClick={editOrder} className="w-full btn-ghost text-sm py-2.5 mb-4 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Edit Order
              </button>

              {/* Payment Options */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold th-muted mb-3">Payment Option</h3>
                <div className="space-y-2">
                  {[
                    { value: 'pay-later', label: 'Pay Later', desc: 'Pay at the restaurant' },
                    { value: 'pay-deposit', label: 'Pay Deposit', desc: 'Partial payment now' },
                    { value: 'pay-full', label: 'Pay Full', desc: 'Complete payment now' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 glass rounded-xl p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                      <input type="radio" name="payment-option" value={opt.value} checked={paymentOption === opt.value} onChange={e => setPaymentOption(e.target.value)} className="text-primary-500"/>
                      <div>
                        <span className="text-sm font-medium th-heading">{opt.label}</span>
                        <p className="text-xs th-ghost">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Deposit Input */}
              {paymentOption === 'pay-deposit' && (
                <div className="mb-6">
                  <label className="block th-muted text-sm font-medium mb-2">Deposit Amount</label>
                  <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" type="number" placeholder="Enter deposit amount" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))}/>
                </div>
              )}

              {/* Place Order Button */}
              <button onClick={placeOrder} className="w-full btn-primary text-base py-3.5 flex items-center justify-center gap-2">
                {paymentOption === 'pay-later' ? 'Confirm Order' : 'Pay & Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
