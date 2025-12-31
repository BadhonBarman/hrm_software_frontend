'use client'

import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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
    <>
    <div className='bg-gray-100 grid grid-cols-1 md:grid-cols-2 h-screen pt-12 md:pt-0 overflow-hidden'>
        <div className='overflow-hidden'>
            <Image  src={"/images/auth_art.png"} height={412} width={1076} alt="login-illustration" className="w-[912px] hidden sm:block h-full object-center"/>
        </div>

        <div className='container flex flex-col items-start px-8 lg:pt-28 pt-4 md:px-42 2xl:px-64 lg:py-20 2xl:py-30'>

            <div className='text-center w-full font-bold text-2xl'>
                <h2>Sign in</h2>
            </div>

            <form onSubmit={handleSubmit} className='w-full mt-10 space-y-4'>
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
                <div className='flex flex-row justify-end'>
                    <Link href={"/reset-password/"} className='text-sm text-blue-600 hover:underline'>Forgot Password?</Link>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className='w-full px-4 py-3 mt-0 text-white primary_blue_bg rounded-lg hover:bg-[#102633] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <div className='w-full flex flex-row items-center justify-center gap-4 mt-6 text-gray-500'>
                <Separator className='flex-1 bg-white' />
                <p>or</p>
                <Separator className='flex-1 bg-white' />
            </div>

            <div className='w-full mt-6 space-y-2.5'>
                <Link href={"/api/auth/google"} className='flex flex-row gap-4 items-center justify-center w-full px-4 py-3 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'>
                    <Image src={"/icons/Google.png"} alt="google-icon" width={20} height={20} />
                    <p>Sign in with Google</p>
                </Link>
            </div>

            {/* <div className='flex flex-row gap-2.5 items-center mt-6 justify-center w-full text-sm'>
                <p>Don't you have an account?</p>
                <Link href={"/auth/signup"} className='text-blue-600 hover:underline'>Sign up</Link>
            </div> */}

        </div>
    </div>
    </>
  )
}
