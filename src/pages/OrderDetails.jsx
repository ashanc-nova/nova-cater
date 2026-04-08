import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCatering } from '../context/CateringContext'

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const createInitialCustomerForm = (profile) => ({
  firstName: profile?.firstName || '',
  lastName: profile?.lastName || '',
  emailAddress: profile?.emailAddress || '',
  mobileNumber: profile?.mobileNumber || '',
  countryCode: profile?.countryCode || '+1',
})

const splitEventDateTime = (eventDateTime) => {
  if (!eventDateTime) return { eventDate: '', eventTime: '' }
  const [eventDate, timePart = ''] = eventDateTime.split('T')
  return {
    eventDate,
    eventTime: timePart.slice(0, 5),
  }
}

export default function OrderDetails() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editingOrderId = searchParams.get('orderId')
  const {
    auth,
    isAuthenticated,
    cart,
    cartItems,
    cartLoading,
    cartError,
    eventDraft,
    saveDraftAndRefreshCart,
    submitOrder,
    updateExistingOrder,
    fetchOrder,
    loadOrderIntoDraft,
    selectedStore,
    mapPaymentOptionFromApi,
  } = useCatering()

  const [draft, setDraft] = useState(eventDraft)
  const [paymentOption, setPaymentOption] = useState('pay-later')
  const [customerForm, setCustomerForm] = useState(createInitialCustomerForm(auth.profile))
  const [editingOrder, setEditingOrder] = useState(null)
  const [orderLoading, setOrderLoading] = useState(Boolean(editingOrderId))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    setCustomerForm(createInitialCustomerForm(auth.profile))
  }, [auth.profile])

  useEffect(() => {
    if (!editingOrderId) {
      setDraft(eventDraft)
      return
    }

    let cancelled = false
    setOrderLoading(true)
    setError('')

    fetchOrder(editingOrderId, searchParams.get('restaurant') || selectedStore?.refId || 'rest_san_ramon')
      .then((order) => {
        if (cancelled) return
        setEditingOrder(order)
        const { eventDate, eventTime } = splitEventDateTime(order.eventDetails?.eventDateTime)
        const nextDraft = {
          eventName: order.eventDetails?.eventName || '',
          eventDate,
          eventTime,
          serviceType: order.eventDetails?.serviceType || 'delivery',
          deliveryAddress: order.eventDetails?.deliveryAddress || '',
          guestCount: String(order.eventDetails?.guestCount || ''),
          specialRequirements: order.eventDetails?.specialRequirements || '',
        }
        setDraft(nextDraft)
        loadOrderIntoDraft(order)
        setPaymentOption(mapPaymentOptionFromApi(order.paymentOption))
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load this order for editing.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOrderLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [editingOrderId])

  useEffect(() => {
    if (editingOrderId) return

    const timeoutId = window.setTimeout(() => {
      saveDraftAndRefreshCart(draft)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [
    editingOrderId,
    draft.deliveryAddress,
    draft.eventDate,
    draft.eventName,
    draft.eventTime,
    draft.guestCount,
    draft.serviceType,
    draft.specialRequirements,
  ])

  const currentItems = editingOrder ? editingOrder.menuItems : cartItems
  const currentPricing = editingOrder ? editingOrder.paymentDetails : cart?.paymentDetails
  const currentValidation = editingOrder ? editingOrder.validation : cart?.validation
  const currentDeposit = editingOrder ? editingOrder.depositDetails : cart?.depositDetails
  const isPaymentLocked = editingOrder && Number(editingOrder.paymentDetails?.amountPaid || 0) > 0

  const handleDraftChange = (key, value) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleCustomerChange = (key, value) => {
    setCustomerForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const goBackToMenu = async () => {
    await saveDraftAndRefreshCart(draft)
    navigate('/')
  }

  const handleSubmit = async () => {
    if (!editingOrderId && currentItems.length === 0) {
      setError('Add at least one catering package before continuing.')
      return
    }

    if (!draft.eventName || !draft.eventDate || !draft.eventTime || !draft.guestCount) {
      setError('Event name, date, time, and guest count are required.')
      return
    }

    if (draft.serviceType === 'delivery' && !draft.deliveryAddress) {
      setError('Delivery address is required for delivery orders.')
      return
    }

    if (!editingOrderId && !isAuthenticated) {
      if (!customerForm.firstName || !customerForm.lastName || !customerForm.mobileNumber) {
        setError('Please fill in your contact details to place the order.')
        return
      }
    }

    setSubmitting(true)
    setError('')

    try {
      const order = editingOrderId
        ? await updateExistingOrder({
            orderRefId: editingOrderId,
            draft,
            paymentOption,
          })
        : await submitOrder({
            draft,
            paymentOption,
            profileInput: customerForm,
          })

      navigate(`/order-summary?id=${order.orderRefId}`)
    } catch (err) {
      setError(err.message || 'Unable to save the order right now.')
    } finally {
      setSubmitting(false)
    }
  }

  if (orderLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="glass rounded-3xl p-10 text-center">
          <p className="th-muted">Loading your catering order...</p>
        </div>
      </main>
    )
  }

  if (!editingOrderId && currentItems.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="glass rounded-3xl p-10 text-center">
          <p className="th-muted">Your catering cart is empty.</p>
          <button onClick={() => navigate('/')} className="btn-primary text-sm py-2.5 px-5 mt-4">
            Browse Catering Packages
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
      <div className="mb-10 animate-slide-up">
        <div className="inline-flex items-center gap-2 badge-glass text-primary-300 mb-4">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          {editingOrderId ? 'Update Order' : 'Order Details'}
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl th-heading">
          {editingOrderId ? 'Modify Catering Order' : 'Finalize Your Order'}
        </h1>
        <p className="th-faint mt-2">
          {editingOrderId
            ? 'Update the event details before the modification cutoff.'
            : 'Fill in your event details and review the live catering quote.'}
        </p>
      </div>

      {(error || cartError) && (
        <div className="glass rounded-2xl p-4 text-sm text-red-300 mb-6">
          {error || cartError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-strong rounded-3xl p-8">
            <h2 className="font-display font-bold text-xl th-heading mb-6">Event Details</h2>
            <div className="space-y-5">
              <div>
                <label className="block th-muted text-sm font-medium mb-2" htmlFor="eventName">Event Name</label>
                <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" id="eventName" type="text" placeholder="e.g., Annual Team Dinner" value={draft.eventName} onChange={e => handleDraftChange('eventName', e.target.value)}/>
              </div>

              <div>
                <label className="block th-muted text-sm font-medium mb-3">Event Date &amp; Time</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input id="eventDate" type="date" value={draft.eventDate} onChange={e => handleDraftChange('eventDate', e.target.value)} className="glass-input w-full py-4 px-4 rounded-2xl text-sm font-medium th-heading" />
                  <input id="eventTime" type="time" value={draft.eventTime} onChange={e => handleDraftChange('eventTime', e.target.value)} className="glass-input w-full py-4 px-4 rounded-2xl text-sm font-medium th-heading" />
                </div>
              </div>

              <div>
                <label className="block th-muted text-sm font-medium mb-3">Service Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'delivery', label: 'Delivery' },
                    { value: 'pickup', label: 'Pickup' },
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer">
                      <input type="radio" name="serviceType" value={opt.value} checked={draft.serviceType === opt.value} onChange={e => handleDraftChange('serviceType', e.target.value)} className="hidden peer"/>
                      <div className="glass rounded-2xl p-4 text-center transition-all duration-300 peer-checked:bg-primary-500/20 peer-checked:border-primary-500/40 border border-transparent hover:bg-black/5 dark:hover:bg-white/5">
                        <span className="text-sm font-semibold th-muted">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {draft.serviceType === 'delivery' && (
                <div>
                  <label className="block th-muted text-sm font-medium mb-2" htmlFor="deliveryAddress">Delivery Address</label>
                  <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" id="deliveryAddress" type="text" placeholder="Enter delivery address" value={draft.deliveryAddress} onChange={e => handleDraftChange('deliveryAddress', e.target.value)}/>
                </div>
              )}

              <div>
                <label className="block th-muted text-sm font-medium mb-2" htmlFor="guestCount">Number of Guests</label>
                <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" id="guestCount" type="number" placeholder="How many guests?" value={draft.guestCount} onChange={e => handleDraftChange('guestCount', e.target.value)}/>
              </div>

              <div>
                <label className="block th-muted text-sm font-medium mb-2" htmlFor="specialRequirements">Special Requirements</label>
                <textarea className="glass-input w-full py-3 px-4 rounded-2xl text-sm resize-none" id="specialRequirements" rows="3" placeholder="Allergies, dietary needs, setup preferences..." value={draft.specialRequirements} onChange={e => handleDraftChange('specialRequirements', e.target.value)}/>
              </div>
            </div>

            {!isAuthenticated && !editingOrderId && (
              <div className="mt-8 border-t border-black/5 dark:border-white/5 pt-8">
                <h2 className="font-display font-bold text-xl th-heading mb-6">Customer Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" type="text" placeholder="First name" value={customerForm.firstName} onChange={e => handleCustomerChange('firstName', e.target.value)} />
                  <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" type="text" placeholder="Last name" value={customerForm.lastName} onChange={e => handleCustomerChange('lastName', e.target.value)} />
                  <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" type="tel" placeholder="Mobile number" value={customerForm.mobileNumber} onChange={e => handleCustomerChange('mobileNumber', e.target.value)} />
                  <input className="glass-input w-full py-3 px-4 rounded-2xl text-sm" type="email" placeholder="Email address" value={customerForm.emailAddress} onChange={e => handleCustomerChange('emailAddress', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="lg:sticky lg:top-28 space-y-6">
            <div className="glass-strong rounded-3xl p-6">
              <h2 className="font-display font-bold text-xl th-heading mb-6">Review Order</h2>
              <div className="space-y-3 mb-6">
                {currentItems.map((item, index) => (
                  <div key={item.refId || index} className="flex justify-between items-center py-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold th-heading text-sm truncate">{item.name}</h3>
                      <p className="text-xs th-faint">Qty: {item.quantity} x {item.unit}</p>
                    </div>
                    <span className="text-sm font-bold th-heading ml-3">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-black/5 dark:border-white/5 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="th-faint">Subtotal</span>
                  <span className="th-heading font-medium">{formatCurrency(currentPricing?.subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="th-faint">Tax</span>
                  <span className="th-heading font-medium">{formatCurrency(currentPricing?.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="th-faint">Fees</span>
                  <span className="th-heading font-medium">{formatCurrency((currentPricing?.serviceFee || 0) + (currentPricing?.extraCharges || 0))}</span>
                </div>
                <div className="border-t border-black/5 dark:border-white/5 pt-3 flex justify-between">
                  <span className="font-bold th-heading">Total</span>
                  <span className="text-xl font-bold gradient-text">{formatCurrency(currentPricing?.grandTotal)}</span>
                </div>
              </div>

              {!editingOrderId && (
                <button onClick={goBackToMenu} className="w-full btn-ghost text-sm py-2.5 mb-4">
                  Edit Package Selection
                </button>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-semibold th-muted mb-3">Payment Option</h3>
                <div className="space-y-2">
                  {[
                    { value: 'pay-later', label: 'Pay Later', desc: 'Confirm now and pay later' },
                    { value: 'pay-deposit', label: 'Pay Deposit', desc: `Pay ${formatCurrency(currentDeposit?.depositAmount)} now` },
                    { value: 'pay-full', label: 'Pay Full', desc: 'Pay the full order at confirmation' },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 glass rounded-xl p-3 transition-all ${isPaymentLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'}`}>
                      <input type="radio" name="payment-option" value={opt.value} checked={paymentOption === opt.value} onChange={e => setPaymentOption(e.target.value)} disabled={isPaymentLocked} className="text-primary-500"/>
                      <div>
                        <span className="text-sm font-medium th-heading">{opt.label}</span>
                        <p className="text-xs th-ghost">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={handleSubmit} disabled={submitting || cartLoading} className="w-full btn-primary text-sm py-3 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Saving...' : editingOrderId ? 'Save Changes' : paymentOption === 'pay-later' ? 'Confirm Order' : 'Pay & Confirm'}
              </button>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="font-display font-bold text-lg th-heading mb-4">Live Validation</h3>
              <div className="space-y-3">
                {selectedStore && (
                  <div className="glass rounded-2xl p-4">
                    <p className="text-xs th-ghost mb-1">Fulfillment Store</p>
                    <p className="text-sm font-semibold th-heading">{selectedStore.name}</p>
                    <p className="text-xs th-faint mt-1">{selectedStore.address}</p>
                  </div>
                )}
                <div className="glass rounded-2xl p-4">
                  <p className="text-xs th-ghost mb-1">Validation Status</p>
                  <p className={`text-sm font-semibold ${currentValidation?.reviewRequired ? 'text-yellow-300' : 'text-green-300'}`}>
                    {currentValidation?.reviewRequired ? 'Manual review may be required' : 'Ready for normal catering checkout'}
                  </p>
                </div>
                {(currentValidation?.reviewFlags || []).map((flag) => (
                  <div key={flag.type} className="glass rounded-2xl p-4">
                    <p className="text-sm th-heading">{flag.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
