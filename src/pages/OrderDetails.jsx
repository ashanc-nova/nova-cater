import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDateInput = (isoDate) => {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return ''
  return `${month}/${day}/${year}`
}

const parseDateInput = (value) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const [, month, day, year] = match
  const iso = `${year}-${month}-${day}`
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const normalized = date.toISOString().split('T')[0]
  return normalized === iso ? iso : ''
}

const normalizeDateTyping = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const getTimeEditorParts = (value) => {
  if (!value) return { input: '', period: 'AM' }
  const [rawHour = '0', minute = '00'] = value.split(':')
  const hour = Number(rawHour)
  const period = hour >= 12 ? 'PM' : 'AM'
  const normalized = hour % 12 || 12
  return {
    input: `${String(normalized).padStart(2, '0')}:${minute}`,
    period,
  }
}

const normalizeTimeTyping = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

const parseTimeEditorValue = (value, period) => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return ''
  let hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return ''
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const getTodayDateString = () => new Date().toISOString().split('T')[0]

const getMinimumTimeForSelectedDate = (selectedDate) => {
  if (!selectedDate || selectedDate !== getTodayDateString()) return ''

  const now = new Date()
  const hours = `${now.getHours()}`.padStart(2, '0')
  const minutes = `${now.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}

const getNativePickerDate = (isoDate) => isoDate || getTodayDateString()

export default function OrderDetails() {
  const { cart, clearCart } = useCart()
  const navigate = useNavigate()
  const nativeDateInputRef = useRef(null)

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventDateInput, setEventDateInput] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventTimeInput, setEventTimeInput] = useState('')
  const [eventTimePeriod, setEventTimePeriod] = useState('AM')
  const [serviceType, setServiceType] = useState('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [paymentOption, setPaymentOption] = useState('pay-later')
  const [depositAmount, setDepositAmount] = useState(0)
  const [validationMessage, setValidationMessage] = useState('')

  const eventDateTime = eventDate && eventTime ? `${eventDate}T${eventTime}` : ''

  useEffect(() => {
    window.scrollTo(0, 0)
    const saved = JSON.parse(localStorage.getItem('snsAppEventDetails') || '{}')
    const lastCustomerDetails = JSON.parse(localStorage.getItem('snsLastCustomerDetails') || '{}')
    setEventName(saved.eventName || '')
    if (saved.eventDateTime) {
      const [savedDate, savedTime] = saved.eventDateTime.split('T')
      setEventDate(savedDate || '')
      setEventDateInput(formatDateInput(savedDate || ''))
      setEventTime(savedTime || '')
      const timeParts = getTimeEditorParts(savedTime || '')
      setEventTimeInput(timeParts.input)
      setEventTimePeriod(timeParts.period)
    }
    const savedService = saved.serviceType && saved.serviceType !== 'dineIn' ? saved.serviceType : 'pickup'
    setServiceType(savedService)
    setDeliveryAddress(saved.deliveryAddress || '')
    setDeliveryInstructions(saved.deliveryInstructions || '')
    setGuestCount(saved.guestCount || '')
    setCustomerName(saved.customerName || lastCustomerDetails.customerName || '')
    setCustomerPhone(saved.customerPhone || lastCustomerDetails.customerPhone || '')
    setCustomerEmail(saved.customerEmail || lastCustomerDetails.customerEmail || '')
    setSpecialRequirements(saved.specialRequirements || '')
  }, [])

  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = cartSubtotal * 0.1
  const serviceFee = cartSubtotal * 0.06
  const total = cartSubtotal + tax + serviceFee
  const suggestedDeposits = [0.25, 0.5, 0.75].map(multiplier => Number((total * multiplier).toFixed(2)))
  const minAllowedTime = getMinimumTimeForSelectedDate(eventDate)

  useEffect(() => {
    if (minAllowedTime && eventTime && eventTime < minAllowedTime) {
      setEventTime(minAllowedTime)
      const timeParts = getTimeEditorParts(minAllowedTime)
      setEventTimeInput(timeParts.input)
      setEventTimePeriod(timeParts.period)
    }
  }, [eventDate, eventTime, minAllowedTime])

  useEffect(() => {
    if (paymentOption === 'pay-deposit') {
      const defaultDeposit = Number((total * 0.25).toFixed(2))
      setDepositAmount(current => {
        if (!current || current > total) return defaultDeposit
        return current
      })
    }
  }, [paymentOption, total])

  const paymentHint = paymentOption === 'pay-later'
    ? 'You can confirm this order now and pay at the restaurant when the catering order is fulfilled.'
    : paymentOption === 'pay-deposit'
      ? 'Pay part of the order now to lock it in, then settle the remaining balance later.'
      : 'You will pay the full order total now so nothing is left due at pickup or delivery.'

  const saveEventDetails = () => {
    localStorage.setItem('snsAppEventDetails', JSON.stringify({
      eventName,
      eventDateTime,
      serviceType,
      deliveryAddress,
      deliveryInstructions,
      guestCount,
      customerName,
      customerPhone,
      customerEmail,
      specialRequirements,
    }))
  }

  const editOrder = () => {
    saveEventDetails()
    navigate('/')
  }

  const showValidation = (message) => {
    setValidationMessage(message)
  }

  const placeOrder = () => {
    if (!eventName.trim()) {
      showValidation('Please enter the event name before placing the order.')
      return
    }

    if (!guestCount.trim()) {
      showValidation('Please enter the party size before placing the order.')
      return
    }

    if (!eventDateInput.trim() || !eventDate) {
      showValidation('Please enter the event date in MM/DD/YYYY format.')
      return
    }

    if (!eventTimeInput.trim() || !eventTime) {
      showValidation('Please enter the event time in HH:MM format and choose AM or PM.')
      return
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      showValidation('Please enter the customer name and phone number before placing the order.')
      return
    }

    if (!/^\d{10}$/.test(customerPhone)) {
      showValidation('Please enter a valid 10-digit phone number.')
      return
    }

    if (eventDate && eventDate < getTodayDateString()) {
      showValidation('Please choose today or a future date for the event.')
      return
    }

    if (minAllowedTime && eventTime && eventTime < minAllowedTime) {
      showValidation('Please choose a future time for today.')
      return
    }

    const orderId = `order_${Date.now()}`
    const orderDetails = {
      id: orderId,
      eventName: eventName || 'Unnamed Event',
      eventDate: eventDateTime || 'Date not specified',
      serviceType,
      deliveryAddress,
      deliveryInstructions,
      guestCount,
      customerName,
      customerPhone,
      customerEmail,
      specialRequirements,
      cart,
      subtotal: cartSubtotal,
      tax,
      serviceFee,
      total,
      paymentOption,
      depositAmount: paymentOption === 'pay-deposit' ? depositAmount : paymentOption === 'pay-full' ? total : 0,
      status: 'Confirmed',
      paymentStatus: paymentOption === 'pay-later' ? 'Unpaid' : paymentOption === 'pay-deposit' ? 'Partially Paid' : 'Paid',
      placedDate: new Date().toISOString(),
    }

    const orders = JSON.parse(localStorage.getItem('snsAppOrders') || '[]')
    orders.unshift(orderDetails)
    localStorage.setItem('snsAppOrders', JSON.stringify(orders))
    localStorage.setItem('snsLastCustomerDetails', JSON.stringify({
      customerName,
      customerPhone,
      customerEmail,
    }))

    const trustedOrderIds = JSON.parse(localStorage.getItem('snsTrustedOrderIds') || '[]')
    if (!trustedOrderIds.includes(orderId)) {
      trustedOrderIds.unshift(orderId)
      localStorage.setItem('snsTrustedOrderIds', JSON.stringify(trustedOrderIds))
    }

    clearCart()
    localStorage.removeItem('snsAppEventDetails')
    navigate(`/order-summary?id=${orderId}`)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
      <div className="mb-8 animate-slide-up">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full glass flex items-center justify-center th-muted hover:th-heading transition-colors mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="inline-flex items-center gap-2 badge-glass text-primary-300">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Order Details
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)] gap-8 items-stretch">
        <section className="glass-strong rounded-[32px] p-6 md:p-7 animate-slide-up h-full" style={{ animationDelay: '0.05s' }}>
          <div className="space-y-6">
            <div className="glass rounded-[28px] p-6">
              <div className="mb-5">
                <h2 className="text-[28px] font-bold tracking-tight th-heading">Event details</h2>
                <p className="th-muted text-sm mt-1">Time needed to prepare an order before it is ready for pickup or delivery</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <label className="block">
                  <span className="block text-sm th-muted mb-2">Event name</span>
                  <input className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm" value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Enter event name" />
                </label>
                <label className="block">
                  <span className="block text-sm th-muted mb-2">Party size</span>
                  <input className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm" value={guestCount} onChange={e => setGuestCount(e.target.value)} placeholder="Enter party size" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  {
                    value: 'pickup',
                    label: 'Pickup',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    ),
                  },
                  {
                    value: 'delivery',
                    label: 'Delivery',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A2 2 0 013 15.382V8.618a2 2 0 011.106-1.789l5-2.5a2 2 0 011.788 0l5 2.5A2 2 0 0117 8.618v6.764a2 2 0 01-1.106 1.79L10 20m0 0l5-2.5M10 20V10"/></svg>
                    ),
                  },
                ].map(option => {
                  const active = serviceType === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => setServiceType(option.value)}
                      className={`rounded-[26px] border p-6 text-left transition-all ${active ? 'bg-primary-700 text-white border-primary-700 shadow-[0_12px_30px_rgba(199,33,41,0.25)]' : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/8 dark:border-white/8 th-muted hover:border-primary-300/30'}`}
                    >
                      <div className={`mb-5 ${active ? 'text-white' : 'text-primary-400'}`}>{option.icon}</div>
                      <div className={`text-[18px] font-semibold ${active ? 'text-white' : 'th-heading'}`}>{option.label}</div>
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <label className="block">
                  <span className="block text-sm th-muted mb-2">Date</span>
                  <div className="glass-input w-full h-14 rounded-2xl px-4 text-sm flex items-center justify-between gap-3">
                    <input
                      className="bg-transparent h-full flex-1 outline-none focus:outline-none focus:ring-0"
                      inputMode="numeric"
                      value={eventDateInput}
                      onChange={e => {
                        const nextValue = normalizeDateTyping(e.target.value)
                        setEventDateInput(nextValue)
                        const parsed = parseDateInput(nextValue)
                        setEventDate(parsed)
                      }}
                      onBlur={() => {
                        const parsed = parseDateInput(eventDateInput)
                        if (parsed) {
                          setEventDate(parsed)
                          setEventDateInput(formatDateInput(parsed))
                        }
                      }}
                      placeholder="MM/DD/YYYY"
                    />
                    <button
                      type="button"
                      onClick={() => nativeDateInputRef.current?.showPicker?.() ?? nativeDateInputRef.current?.click()}
                      className="shrink-0 th-faint hover:th-heading transition-colors"
                      aria-label="Open date picker"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"/></svg>
                    </button>
                    <input
                      ref={nativeDateInputRef}
                      type="date"
                      className="sr-only"
                      min={getTodayDateString()}
                      value={getNativePickerDate(eventDate)}
                      onChange={e => {
                        const nextDate = e.target.value
                        setEventDate(nextDate)
                        setEventDateInput(formatDateInput(nextDate))
                      }}
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="block text-sm th-muted mb-2">Time</span>
                  <div className="glass-input h-14 rounded-2xl px-4 flex items-center justify-between gap-3">
                    <input
                      className="bg-transparent h-full flex-1 text-sm outline-none focus:outline-none focus:ring-0 focus:border-transparent border-0 shadow-none"
                      inputMode="numeric"
                      value={eventTimeInput}
                      onChange={e => {
                        const nextValue = normalizeTimeTyping(e.target.value)
                        setEventTimeInput(nextValue)
                        setEventTime(parseTimeEditorValue(nextValue, eventTimePeriod))
                      }}
                      onBlur={() => {
                        const parsed = parseTimeEditorValue(eventTimeInput, eventTimePeriod)
                        if (parsed) {
                          setEventTime(parsed)
                          setEventTimeInput(getTimeEditorParts(parsed).input)
                        }
                      }}
                      placeholder="HH:MM"
                    />
                    <div className="inline-flex items-center rounded-xl bg-black/[0.04] dark:bg-white/[0.05] p-1 shrink-0">
                      {['AM', 'PM'].map(period => {
                        const active = eventTimePeriod === period
                        return (
                          <button
                            key={period}
                            type="button"
                            onClick={() => {
                              const nextPeriod = period
                              setEventTimePeriod(nextPeriod)
                              setEventTime(parseTimeEditorValue(eventTimeInput, nextPeriod))
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${active ? 'bg-primary-700 text-white shadow-sm' : 'th-muted hover:th-heading'}`}
                          >
                            {period}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </label>
              </div>

              {serviceType === 'delivery' && (
                <>
                  <label className="block mb-4">
                    <span className="block text-sm th-muted mb-2">Delivery address</span>
                    <input className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Enter delivery address" />
                  </label>
                  <label className="block mb-4">
                    <span className="block text-sm th-muted mb-2">Delivery instructions</span>
                    <input className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm" value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)} placeholder="Enter delivery instructions" />
                  </label>
                </>
              )}

              <label className="block">
                <span className="block text-sm th-muted mb-2">Special requirements</span>
                <textarea className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm resize-none" rows="3" value={specialRequirements} onChange={e => setSpecialRequirements(e.target.value)} placeholder="Dietary notes, setup requests, or anything the team should know" />
              </label>
            </div>

            <div className="glass rounded-[28px] p-6">
              <div className="mb-5">
                <h2 className="text-[28px] font-bold tracking-tight th-heading">Customer details</h2>
                <p className="th-muted text-sm mt-1">We’ll use this to share order updates and coordinate the handoff</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="block text-sm th-muted mb-2">Name *</span>
                  <input className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="block text-sm th-muted mb-2">Phone number *</span>
                  <input
                    className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
                    type="tel"
                    inputMode="numeric"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </label>
                <label className="block">
                  <span className="block text-sm th-muted mb-2">Email (optional)</span>
                  <input className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="glass rounded-[28px] p-6">
              <div className="mb-5">
                <h2 className="text-[28px] font-bold tracking-tight th-heading">Payment type</h2>
                <p className="th-muted text-sm mt-1">Choose how you want to settle this catering order</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'pay-later', label: 'Pay Later' },
                  { value: 'pay-deposit', label: 'Paid Deposit' },
                  { value: 'pay-full', label: 'Full Payment' },
                ].map(option => {
                  const active = paymentOption === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => setPaymentOption(option.value)}
                      className={`px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${active ? 'bg-primary-500/12 border-primary-400 text-primary-400' : 'border-black/10 dark:border-white/10 th-muted hover:border-primary-300/30'}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-black/8 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.03] px-4 py-3">
                <p className="text-sm th-muted">{paymentHint}</p>
              </div>

              {paymentOption === 'pay-deposit' && (
                <div className="mt-4 rounded-2xl border border-primary-300/20 bg-primary-500/5 px-4 py-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold th-heading">Deposit amount</p>
                      <p className="text-sm th-muted">Choose how much you want to pay now.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide th-faint">Pay now</p>
                      <p className="text-lg font-semibold text-primary-400">{formatCurrency(Math.min(depositAmount || 0, total))}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {suggestedDeposits.map(amount => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(amount)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${depositAmount === amount ? 'bg-primary-500/15 border-primary-400 text-primary-400' : 'border-black/10 dark:border-white/10 th-muted hover:border-primary-300/30'}`}
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                    <button
                      onClick={() => setDepositAmount(Number(total.toFixed(2)))}
                      className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${depositAmount === Number(total.toFixed(2)) ? 'bg-primary-500/15 border-primary-400 text-primary-400' : 'border-black/10 dark:border-white/10 th-muted hover:border-primary-300/30'}`}
                    >
                      Full total
                    </button>
                  </div>

                  <label className="block">
                    <span className="block text-sm th-muted mb-2">Custom deposit</span>
                    <input
                      className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
                      type="number"
                      min="0"
                      max={total.toFixed(2)}
                      step="0.01"
                      value={depositAmount}
                      onChange={e => setDepositAmount(Math.min(Number(e.target.value || 0), Number(total.toFixed(2))))}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="animate-slide-up h-full" style={{ animationDelay: '0.1s' }}>
          <div className="xl:sticky xl:top-28 h-full">
            <div className="glass-strong rounded-[32px] p-5 h-full flex flex-col">
              <div className="glass rounded-[28px] p-5 mb-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center">
                    <svg className="w-5 h-5 th-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  </div>
                  <h2 className="text-[28px] font-bold tracking-tight th-heading">Items</h2>
                </div>

                <div className="space-y-5">
                  {cart.map((item, index) => (
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

              <button onClick={editOrder} className="glass rounded-[28px] p-5 w-full flex items-center justify-between mb-5 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-full bg-primary-500/15 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </div>
                    <div>
                      <p className="text-[18px] font-semibold th-heading">Edit order</p>
                      <p className="th-muted text-sm">Go back and adjust menu items</p>
                    </div>
                  </div>
                <svg className="w-5 h-5 th-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>

              <div className="mt-auto">
                <div className="glass rounded-[28px] p-5">
                <div className="space-y-3 pb-5 border-b border-dashed border-black/10 dark:border-white/10">
                  <div className="flex items-center justify-between text-base">
                    <span className="th-muted">Subtotal</span>
                    <span className="th-heading font-medium">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="th-muted">Tax</span>
                    <span className="th-heading font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="th-muted">Service fee</span>
                    <span className="th-heading font-medium">{formatCurrency(serviceFee)}</span>
                  </div>
                  {paymentOption === 'pay-deposit' && (
                    <div className="flex items-center justify-between text-base">
                      <span className="th-muted">Deposit due now</span>
                      <span className="th-heading font-medium">{formatCurrency(Math.min(depositAmount || 0, total))}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-5">
                  <span className="text-[28px] font-bold tracking-tight th-heading">Total</span>
                  <span className="text-[30px] font-bold tracking-tight gradient-text">{formatCurrency(total)}</span>
                </div>
              </div>

                <button onClick={placeOrder} className="w-full btn-primary text-base py-4 mt-5 flex items-center justify-center gap-3 rounded-[28px]">
                  {paymentOption === 'pay-later' ? 'Confirm Order' : paymentOption === 'pay-deposit' ? `Pay ${formatCurrency(Math.min(depositAmount || 0, total))} & Confirm` : 'Pay & Confirm'}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {validationMessage && (
        <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-md glass-strong rounded-[32px] p-6 md:p-7 animate-slide-up">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] th-faint mb-2">Missing details</p>
                <h2 className="text-2xl font-semibold th-heading">Complete this order</h2>
              </div>
              <button
                onClick={() => setValidationMessage('')}
                className="w-10 h-10 rounded-full glass flex items-center justify-center th-muted hover:th-heading transition-colors shrink-0"
                aria-label="Close validation message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="rounded-[24px] border border-rose-500/15 bg-rose-500/6 px-4 py-4">
              <p className="text-sm leading-6 th-heading">{validationMessage}</p>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setValidationMessage('')} className="btn-primary text-sm py-3 px-6 rounded-2xl">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
