import Cookies from 'js-cookie'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ADMIN_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean
}

interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export class ApiException extends Error {
  status?: number
  errors?: Record<string, string[]>

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiException'
    this.status = status
    this.errors = errors
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...restOptions } = options

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (requiresAuth) {
    const accessToken = Cookies.get('access_token')
    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      }
    }
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (response.status === 401 && requiresAuth) {
    const refreshToken = Cookies.get('refresh_token')
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/teacher/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          Cookies.set('access_token', data.access, { 
            expires: 1, 
            sameSite: 'lax',
            path: '/',
            secure: process.env.NODE_ENV === 'production'
          })

          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${data.access}`,
          }
          response = await fetch(`${API_BASE_URL}${endpoint}`, config)
        } else {
          throw new ApiException(
            'Your session has expired. Please login again.',
            401
          )
        }
      } catch (error) {
        if (error instanceof ApiException) {
          throw error
        }
        throw new ApiException(
          'Authentication error. Please try logging in again.',
          401
        )
      }
    } else {
      throw new ApiException(
        'Authentication required. Please login.',
        401
      )
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    let errorDetails: Record<string, string[]> | undefined

    try {
      const errorData = await response.json()
      
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.detail) {
        errorMessage = errorData.detail
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
      

      if (errorData.errors) {
        errorDetails = errorData.errors
      }
      
    } catch (e) {

      if (response.status === 400) {
        errorMessage = 'Bad request. Please check your input.'
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.'
      } else if (response.status === 404) {
        errorMessage = 'The requested resource was not found.'
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      }
    }

    throw new ApiException(errorMessage, response.status, errorDetails)
  }

  return response.json()
}


export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  
  put: <T>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  
  patch: <T>(endpoint: string, data?: any, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  
  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}


export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token')
}


export function logout(): void {
  Cookies.remove('access_token', { path: '/' })
  Cookies.remove('refresh_token', { path: '/' })
  Cookies.remove('user', { path: '/' })
}


export function formatApiError(error: unknown): string {
  if (error instanceof ApiException) {
    if (error.errors) {
      const fieldErrors = Object.entries(error.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ')
      return `${error.message} - ${fieldErrors}`
    }
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}