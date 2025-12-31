'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { api, formatApiError } from '@/lib/api-client'

enum Step {
  EMAIL = 1,
  OTP = 2,
  NEW_PASSWORD = 3,
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(Step.EMAIL)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [timeRemaining, setTimeRemaining] = useState(600)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [canResendOtp, setCanResendOtp] = useState(false)

  useEffect(() => {
    if (step === Step.OTP && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(v => v - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, timeRemaining])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown(v => v - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
    if (resendCooldown === 0) setCanResendOtp(true)
  }, [resendCooldown])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const resetForm = () => {
    setStep(Step.EMAIL)
    setEmail('')
    setOtpCode('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setTimeRemaining(600)
    setResendCooldown(0)
    setCanResendOtp(false)
  }

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/otp/', { email, purpose: 'reset_password' }, { requiresAuth: false })
      setStep(Step.OTP)
      setTimeRemaining(600)
      setResendCooldown(120)
      setCanResendOtp(false)
      setSuccess('OTP sent to your email')
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) return setError('Invalid OTP')
    setLoading(true)
    try {
      await api.put('/otp/', { email, otp_code: otpCode }, { requiresAuth: false })
      setStep(Step.NEW_PASSWORD)
      setSuccess('OTP verified')
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return setError('Passwords do not match')
    setLoading(true)
    try {
      await api.post(
        '/reset-password/',
        { email, otp_code: otpCode, new_password: newPassword },
        { requiresAuth: false }
      )
      setSuccess('Password reset successful')
      setTimeout(() => (window.location.href = '/sign-in'), 2000)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-container min-h-screen overflow-x-hidden grid grid-cols-1 md:grid-cols-2 bg-slate-50">

      {/* IMAGE */}
      <div className="relative hidden md:block">
        <Image
          src="/images/auth_art.png"
          alt="auth"
          fill
          priority
          className="object-contain"
        />
      </div>

      {/* CONTENT */}
      <div className="flex flex-col justify-center w-full px-6 sm:px-10 md:px-14 lg:px-20 2xl:px-32">

        {/* PROGRESS */}
        <div className="flex items-center mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`progress-circle w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s
                    ? 'primary_blue_bg text-white scale-110'
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className="flex-1 h-1 bg-gray-200 mx-2 rounded-full" />}
            </div>
          ))}
        </div>

        {/* TIMER */}
        {step === Step.OTP && (
          <div className="mb-6 p-4 rounded-xl border bg-white">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Time remaining</span>
              <span className={`font-mono font-bold ${timeRemaining < 60 ? 'text-red-600' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        )}

        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-4 text-green-600 text-sm">{success}</div>}

        {/* STEP 1 */}
        {step === Step.EMAIL && (
          <form onSubmit={requestOtp} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
              required
            />
            <button className="btn-press w-full py-3 text-white rounded-xl primary_blue_bg">
              Send Reset Code
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === Step.OTP && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <input
              type="text"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center tracking-widest text-2xl px-4 py-3 border rounded-xl"
              maxLength={6}
            />
            <button className="btn-press w-full py-3 text-white rounded-xl primary_blue_bg">
              Verify Code
            </button>
          </form>
        )}

        {/* STEP 3 */}
        {step === Step.NEW_PASSWORD && (
          <form onSubmit={resetPassword} className="space-y-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
            />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
            />
            <button className="btn-press w-full py-3 text-white rounded-xl primary_blue_bg">
              Reset Password
            </button>
          </form>
        )}

        <a href="/sign-in" className="mt-6 text-center text-sm text-gray-500">
          ← Back to login
        </a>
      </div>
    </div>
  )
}
