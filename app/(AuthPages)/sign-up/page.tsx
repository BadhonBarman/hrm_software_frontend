'use client'

import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Country {
  id: number
  name: string
}

type Step = 'credentials' | 'verification' | 'profile'

export default function SignUpPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('credentials')
  const [isLoading, setIsLoading] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])

  // Step 1: Credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  // Step 2: OTP
  const [otp, setOtp] = useState('')

  // Step 3: Profile
  const [name, setName] = useState('')
  const [institute, setInstitute] = useState('')
  const [designation, setDesignation] = useState('')
  const [subject, setSubject] = useState('')
  const [countryId, setCountryId] = useState<number | ''>('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/countries/`)
      if (!response.ok) throw new Error('Failed to fetch countries')
      const data = await response.json()
      setCountries(data.data || [])
    } catch (error) {
      console.error('Error fetching countries:', error)
      toast.error('Failed to load countries')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview('')
  }

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !passwordConfirm) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (password !== passwordConfirm) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          purpose: 'create_account_verify',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send OTP')
      }

      toast.success('OTP sent to your email!')
      setCurrentStep('verification')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp) {
      toast.error('Please enter the OTP')
      return
    }

    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp_code: otp,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Invalid OTP')
      }

      toast.success('Email verified successfully!')
      setCurrentStep('profile')
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Complete Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !institute || !designation || !subject || !countryId) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      if (image) {
        formData.append('image', image)
      }
      formData.append('password', password)
      formData.append('password_confirm', passwordConfirm)
      formData.append('name', name)
      formData.append('institute', institute)
      formData.append('designation', designation)
      formData.append('subject', subject)
      formData.append('country', countryId.toString())
      formData.append('email', email)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teacher/register/`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }

      toast.success('Registration successful! Please sign in.')
      router.push('/sign-in')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          purpose: 'account_email_verify',
        }),
      })

      if (!response.ok) throw new Error('Failed to resend OTP')
      toast.success('OTP resent successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='bg-gray-100 grid grid-cols-1 md:grid-cols-2 h-screen pt-12 md:pt-0 overflow-hidden'>
      <div className='overflow-hidden'>
        <Image src={"/images/auth_art.png"} height={412} width={1076} alt="signup-illustration" className="w-[912px] hidden sm:block h-full object-center"/>
      </div>

      <div className='container flex flex-col items-start px-8 lg:pt-28 pt-4 md:px-42 2xl:px-64 lg:py-20 2xl:py-30 overflow-y-auto'>
        {/* Progress Indicator */}
        <div className='w-full mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className={`flex items-center ${currentStep === 'credentials' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'credentials' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className='ml-2 text-xs hidden sm:inline'>Credentials</span>
            </div>
            <div className='flex-1 h-1 mx-2 bg-gray-300'>
              <div className={`h-full transition-all ${currentStep !== 'credentials' ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ width: currentStep !== 'credentials' ? '100%' : '0%' }}></div>
            </div>
            <div className={`flex items-center ${currentStep === 'verification' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'verification' ? 'bg-blue-600 text-white' : currentStep === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className='ml-2 text-xs hidden sm:inline'>Verify</span>
            </div>
            <div className='flex-1 h-1 mx-2 bg-gray-300'>
              <div className={`h-full transition-all ${currentStep === 'profile' ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ width: currentStep === 'profile' ? '100%' : '0%' }}></div>
            </div>
            <div className={`flex items-center ${currentStep === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className='ml-2 text-xs hidden sm:inline'>Profile</span>
            </div>
          </div>
        </div>

        <div className='text-center w-full font-bold text-2xl'>
          <h2>
            {currentStep === 'credentials' && 'Create Account'}
            {currentStep === 'verification' && 'Verify Email'}
            {currentStep === 'profile' && 'Complete Profile'}
          </h2>
        </div>

        {/* Step 1: Credentials */}
        {currentStep === 'credentials' && (
          <form onSubmit={handleSendOTP} className='w-full mt-10 space-y-4'>
            <div>
              <label htmlFor="email" className='block text-sm font-medium mb-2'>Email Address</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='example@gmail.com' 
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className='block text-sm font-medium mb-2'>Password</label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='at least 8 characters' 
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label htmlFor="passwordConfirm" className='block text-sm font-medium mb-2'>Confirm Password</label>
              <input 
                type="password" 
                id="passwordConfirm" 
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder='re-enter password' 
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className='w-full px-4 py-3 mt-6 text-white primary_blue_bg rounded-lg hover:bg-[#102633] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Sending OTP...' : 'Continue'}
            </button>

            <div className='w-full flex flex-row items-center justify-center gap-4 mt-6 text-gray-500'>
              <Separator className='flex-1 bg-white' />
              <p>or</p>
              <Separator className='flex-1 bg-white' />
            </div>

            <div className='w-full mt-6 space-y-2.5'>
              <button type="button" className='flex flex-row gap-4 items-center justify-center w-full px-4 py-3 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'>
                <Image src={"/icons/Google.png"} alt="google-icon" width={20} height={20} />
                <p>Sign up with Google</p>
              </button>
            </div>

            <div className='flex flex-row gap-2.5 items-center mt-6 justify-center w-full text-sm'>
              <p>Already have an account?</p>
              <Link href={"/sign-in"} className='text-blue-600 hover:underline'>Sign in</Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {currentStep === 'verification' && (
          <form onSubmit={handleVerifyOTP} className='w-full mt-10 space-y-4'>
            <button
              type="button"
              onClick={() => setCurrentStep('credentials')}
              className='flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4'
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className='text-center text-sm text-gray-600 mb-6'>
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </div>

            <div>
              <label htmlFor="otp" className='block text-sm font-medium mb-2'>Verification Code</label>
              <input 
                type="text" 
                id="otp" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder='Enter 6-digit code' 
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest'
                disabled={isLoading}
                maxLength={6}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className='w-full px-4 py-3 mt-6 text-white primary_blue_bg rounded-lg hover:bg-[#102633] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className='text-center text-sm mt-4'>
              <span className='text-gray-600'>Didn't receive the code? </span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className='text-blue-600 hover:underline disabled:opacity-50'
              >
                Resend
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Profile Details */}
        {currentStep === 'profile' && (
          <form onSubmit={handleRegister} className='w-full mt-10 space-y-4'>
            <button
              type="button"
              onClick={() => setCurrentStep('verification')}
              className='flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4'
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Image Upload */}
            <div>
              <label className='block text-sm font-medium mb-2'>Profile Picture (Optional)</label>
              {!imagePreview ? (
                <label className='w-full px-4 py-8 rounded-lg border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center'>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className='text-sm text-gray-600'>Click to upload image</span>
                  <span className='text-xs text-gray-400 mt-1'>Max size: 5MB</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className='hidden'
                    disabled={isLoading}
                  />
                </label>
              ) : (
                <div className='relative w-32 h-32 mx-auto'>
                  <Image src={imagePreview} alt="Preview" width={128} height={128} className='w-full h-full object-cover rounded-lg' />
                  <button
                    type="button"
                    onClick={removeImage}
                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600'
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="name" className='block text-sm font-medium mb-2'>Full Name</label>
              <input 
                type="text" 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='John Doe' 
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="institute" className='block text-sm font-medium mb-2'>Institute</label>
              <input 
                type="text" 
                id="institute" 
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
                placeholder='ABC High School' 
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="designation" className='block text-sm font-medium mb-2'>Designation</label>
              <input 
                type="text" 
                id="designation" 
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder='Teacher' 
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className='block text-sm font-medium mb-2'>Subject</label>
              <input 
                type="text" 
                id="subject" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder='General Bangla' 
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="country" className='block text-sm font-medium mb-2'>Country</label>
              <select 
                id="country" 
                value={countryId}
                onChange={(e) => setCountryId(Number(e.target.value))}
                className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isLoading}
                required
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className='w-full px-4 py-3 mt-6 text-white primary_blue_bg rounded-lg hover:bg-[#102633] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}