'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { api, formatApiError } from '@/lib/api-client'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Clock } from 'lucide-react'

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
    setSuccess('')
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

  const resendOtp = async () => {
    if (!canResendOtp) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/otp/', { email, purpose: 'reset_password' }, { requiresAuth: false })
      setResendCooldown(120)
      setCanResendOtp(false)
      setSuccess('New OTP sent to your email')
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
    setError('')
    setSuccess('')
    try {
      await api.put('/otp/', { email, otp_code: otpCode }, { requiresAuth: false })
      setStep(Step.NEW_PASSWORD)
      setSuccess('OTP verified successfully')
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return setError('Passwords do not match')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.post(
        '/reset-password/',
        { email, otp_code: otpCode, new_password: newPassword },
        { requiresAuth: false }
      )
      setSuccess('Password reset successful! Redirecting to login...')
      setTimeout(() => (window.location.href = '/sign-in'), 2000)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Card Container */}
        <div className='bg-white rounded-2xl shadow-xl p-8 md:p-10'>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8 gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 mx-1 rounded-full transition-all duration-300 ${step > s ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              {step === Step.EMAIL && 'Reset Password'}
              {step === Step.OTP && 'Verify Code'}
              {step === Step.NEW_PASSWORD && 'New Password'}
            </h1>
            <p className='text-gray-500'>
              {step === Step.EMAIL && 'Enter your email to receive a reset code'}
              {step === Step.OTP && 'Enter the 6-digit code sent to your email'}
              {step === Step.NEW_PASSWORD && 'Create a strong new password'}
            </p>
          </div>

          {/* Timer - Only for OTP Step */}
          {step === Step.OTP && (
            <div className="mb-6 p-4 rounded-xl border-2 border-blue-100 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-700">Time remaining</span>
                </div>
                <span className={`font-mono text-lg font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm text-green-600 font-medium">{success}</p>
            </div>
          )}

          {/* STEP 1 - Email Input */}
          {step === Step.EMAIL && (
            <form onSubmit={requestOtp} className="space-y-5">
              <div>
                <label htmlFor="email" className='block text-sm font-semibold text-gray-700 mb-2'>
                  Email Address
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <Mail className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder='example@gmail.com'
                    className='w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className='w-full px-4 py-3.5 text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]'
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* STEP 2 - OTP Verification */}
          {step === Step.OTP && (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div>
                <label htmlFor="otp" className='block text-sm font-semibold text-gray-700 mb-2'>
                  Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder='000000'
                  className='w-full text-center tracking-[0.5em] text-2xl font-bold px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                  maxLength={6}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className='w-full px-4 py-3.5 text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]'
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={!canResendOtp || loading}
                  className='text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline'
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 - New Password */}
          {step === Step.NEW_PASSWORD && (
            <form onSubmit={resetPassword} className="space-y-5">
              <div>
                <label htmlFor="newPassword" className='block text-sm font-semibold text-gray-700 mb-2'>
                  New Password
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <Lock className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder='Enter new password'
                    className='w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600'
                  >
                    {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className='block text-sm font-semibold text-gray-700 mb-2'>
                  Confirm Password
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <Lock className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder='Confirm new password'
                    className='w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600'
                  >
                    {showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className='w-full px-4 py-3.5 text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]'
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className='flex items-center justify-center gap-2 mt-6 text-sm'>
            <p className='text-gray-600'>Remember your password?</p>
            <a
              href="/sign-in"
              className='font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors'
            >
              Sign in
            </a>
          </div>
        </div>

        {/* Footer Text */}
        <p className='text-center text-sm text-gray-500 mt-6'>
          Need help? Contact our support team
        </p>
      </div>
    </div>
  )
}