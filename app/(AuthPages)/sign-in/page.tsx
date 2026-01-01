'use client'

import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Loader2, Mail, Lock } from 'lucide-react'

export default function SignInPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('Login successful!')
      // Cookies are already set in the login function
    } catch (error: any) {
      toast.error(error.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Card Container */}
        <div className='bg-white rounded-2xl shadow-xl p-8 md:p-10'>

          {/* Header */}
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Welcome Back</h1>
            <p className='text-gray-500'>Sign in to continue to your account</p>
          </div>

          {/* Form */}
          <div onSubmit={handleSubmit} className='space-y-5'>
            {/* Email Field */}
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='example@gmail.com'
                  className='w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className='block text-sm font-semibold text-gray-700 mb-2'>
                Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <Lock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='type your password carefully'
                  className='w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className='flex justify-end'>
              <Link
                href={"/reset-password/"}
                className='text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors'
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className='w-full px-4 py-3.5 mt-2 text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]'
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Divider */}
          <div className='flex items-center justify-center gap-4 my-6'>
            <Separator className='flex-1 bg-gray-200' />
            <span className='text-sm text-gray-500 font-medium'>OR</span>
            <Separator className='flex-1 bg-gray-200' />
          </div>

          {/* Google Sign In */}
          <Link
            href={"/api/auth/google"}
            className='flex items-center justify-center gap-3 w-full px-4 py-3.5 text-gray-700 font-semibold bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]'
          >
            <Image src={"/icons/Google.png"} alt="google-icon" width={22} height={22} />
            <span>Sign in with Google</span>
          </Link>

          {/* Sign Up Link - Uncomment if needed */}
          {/* <div className='flex items-center justify-center gap-2 mt-6 text-sm'>
            <p className='text-gray-600'>Don't have an account?</p>
            <Link href={"/auth/signup"} className='font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors'>
              Sign up
            </Link>
          </div> */}
        </div>

        {/* Footer Text */}
        <p className='text-center text-sm text-gray-500 mt-6'>
          By signing in, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}