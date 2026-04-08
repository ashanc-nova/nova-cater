import React, { useState } from 'react'
import { useCatering } from '../context/CateringContext'

export default function AuthCard({
  title = 'Sign In',
  description = 'Use your mobile number to continue.',
  onAuthenticated,
}) {
  const { ensureLogin, sendOtpCode, verifyOtpCode } = useCatering()
  const [step, setStep] = useState('identify')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    mobileNumber: '',
    countryCode: '+1',
    verificationId: '',
    otp: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const updateField = (key, value) => {
    const nextValue =
      key === 'mobileNumber'
        ? value.replace(/\D/g, '').slice(0, 10)
        : key === 'otp'
          ? value.replace(/\D/g, '').slice(0, 6)
          : value

    setForm((current) => ({
      ...current,
      [key]: nextValue,
    }))
  }

  const validateContact = ({ requireMobile = false } = {}) => {
    if (!form.mobileNumber && !form.emailAddress) {
      return 'Enter your mobile number or email address to continue.'
    }

    if (form.mobileNumber && form.mobileNumber.length !== 10) {
      return 'Mobile number must be exactly 10 digits.'
    }

    if (form.emailAddress && !emailPattern.test(form.emailAddress)) {
      return 'Enter a valid email address.'
    }

    if (requireMobile && !form.mobileNumber) {
      return 'Mobile number is required to send OTP.'
    }

    return ''
  }

  const handleLoginWithoutOtp = async () => {
    const contactError = validateContact()
    if (contactError) {
      setError(contactError)
      return
    }

    if (!form.firstName || form.firstName.trim().length < 2) {
      setError('First name must be at least 2 characters.')
      return
    }

    if (!form.lastName || form.lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await ensureLogin(form)
      onAuthenticated?.()
    } catch (err) {
      setError(err.message || 'Unable to sign you in right now.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    const contactError = validateContact({ requireMobile: true })
    if (contactError) {
      setError(contactError)
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await sendOtpCode({
        mobileNumber: form.mobileNumber,
        countryCode: form.countryCode,
      })
      updateField('verificationId', response.verificationId || '')
      updateField('otp', '')
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Unable to send OTP right now.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!form.verificationId || !form.otp) {
      setError('Enter the OTP sent to your mobile number.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await verifyOtpCode({
        verificationId: form.verificationId,
        otp: form.otp,
        fallbackProfile: form,
      })
      onAuthenticated?.()
    } catch (err) {
      setError(err.message || 'Unable to verify OTP right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-strong rounded-3xl p-8 animate-slide-up">
      <h2 className="font-display font-bold text-xl th-heading mb-3">{title}</h2>
      <p className="th-faint text-sm mb-6">{description}</p>

      {error && <div className="glass rounded-2xl p-4 text-sm text-red-300 mb-4">{error}</div>}

      {step === 'identify' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              className="glass-input w-full py-3 px-4 rounded-2xl text-sm"
              type="tel"
              placeholder="Mobile number"
              value={form.mobileNumber}
              onChange={(e) => updateField('mobileNumber', e.target.value)}
              maxLength={10}
            />
            <input
              className="glass-input w-full py-3 px-4 rounded-2xl text-sm"
              type="email"
              placeholder="Email address (optional)"
              value={form.emailAddress}
              onChange={(e) => updateField('emailAddress', e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="btn-primary text-sm py-3 px-6 disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <button
              onClick={() => {
                setError('')
                setStep('guest')
              }}
              className="btn-ghost text-sm py-3 px-6"
            >
              Checkout As Guest
            </button>
          </div>

          <p className="text-sm th-faint">
            Use OTP for your full account, or continue as guest for a faster checkout.
          </p>
        </div>
      )}

      {step === 'guest' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              className="glass-input w-full py-3 px-4 rounded-2xl text-sm"
              type="text"
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
            />
            <input
              className="glass-input w-full py-3 px-4 rounded-2xl text-sm"
              type="text"
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLoginWithoutOtp}
              disabled={loading}
              className="btn-primary text-sm py-3 px-6 disabled:opacity-60"
            >
              {loading ? 'Signing In...' : 'Continue As Guest'}
            </button>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm font-semibold th-heading">OTP sent to {form.mobileNumber}</p>
            <p className="text-xs th-faint mt-1">
              Enter the code you received to sign in.
            </p>
          </div>

          <input
            className="glass-input w-full py-3 px-4 rounded-2xl text-sm"
            type="text"
            placeholder="Enter OTP"
            value={form.otp}
            onChange={(e) => updateField('otp', e.target.value)}
            maxLength={6}
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="btn-primary text-sm py-3 px-6 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="btn-ghost text-sm py-3 px-6 disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
