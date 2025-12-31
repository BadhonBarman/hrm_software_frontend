const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean
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
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      }
    }
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config)


  if (response.status === 401 && requiresAuth) {
    const refreshToken = localStorage.getItem('refresh_token')

    if (refreshToken) {
      try {

        const refreshResponse = await fetch(`${API_BASE_URL}/employee/auth/token-refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          localStorage.setItem('access_token', data.access)


          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${data.access}`,
          }
          response = await fetch(`${API_BASE_URL}${endpoint}`, config)
        } else {

          localStorage.clear()
          window.location.href = '/sign-in'
          throw new Error('Session expired. Please login again.')
        }
      } catch (error) {
        localStorage.clear()
        window.location.href = '/sign-in'
        throw error
      }
    } else {

      localStorage.clear()
      window.location.href = '/sign-in'
      throw new Error('Authentication required')
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
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

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}
