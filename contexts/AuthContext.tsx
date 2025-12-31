'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

interface User {
  id: number
  email: string
  username: string
  user_type: string
  subscription_status: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in on mount
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const accessToken = Cookies.get('access_token')
      if (!accessToken) {
        setIsLoading(false)
        return
      }

      // Verify token with backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employee/auth/token-verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ token: accessToken }),
      })

      if (response.ok) {
        const userData = Cookies.get('user')
        if (userData) {
          try {
            setUser(JSON.parse(userData))
          } catch (e) {
            console.error('Failed to parse user data:', e)
            // Clear invalid user data
            Cookies.remove('user', { path: '/' })
          }
        }
      } else {
        // Token invalid, clear cookies
        Cookies.remove('access_token', { path: '/' })
        Cookies.remove('refresh_token', { path: '/' })
        Cookies.remove('user', { path: '/' })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Don't clear cookies on network error, only on auth failure
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await response.json()

      // Store tokens and user data in cookies with path
      Cookies.set('access_token', data.tokens.access, {
        expires: 1,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      })
      Cookies.set('refresh_token', data.tokens.refresh, {
        expires: 7,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      })
      Cookies.set('user', JSON.stringify(data.user), {
        expires: 7,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      })

      setUser(data.user)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    Cookies.remove('access_token', { path: '/' })
    Cookies.remove('refresh_token', { path: '/' })
    Cookies.remove('user', { path: '/' })
    setUser(null)
    router.push('/sign-in')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
