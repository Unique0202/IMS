import axios from 'axios'

/**
 * Axios instance configured for our API.
 *
 * WHY A CUSTOM INSTANCE?
 *   Instead of writing axios.get('http://localhost:5000/api/...') everywhere,
 *   we configure it once here. Every API call in the app uses this instance.
 *
 * TOKEN HANDLING:
 *   The interceptor automatically adds the JWT token from localStorage
 *   to every request. If you get a 401 response (token expired/invalid),
 *   it clears the token and redirects to login.
 *
 * BASE URL:
 *   In dev, Vite proxies /api requests to localhost:5000 (configured in vite.config.js).
 *   So we use relative URLs like '/api/auth/login' — no hardcoded localhost.
 */
const api = axios.create({
  baseURL: '', // Uses Vite proxy in dev — /api goes to localhost:5000
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with every request
})

// Request interceptor — attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ims_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 (unauthorized) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect to login
      localStorage.removeItem('ims_token')
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
