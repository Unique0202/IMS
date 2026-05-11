import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

/**
 * Login page.
 *
 * Student tab  → Google Sign-In only (restricted to @iiitd.ac.in accounts)
 * Admin tab    → Email + password form (unchanged)
 *
 * Google flow:
 *   1. Google Identity Services renders a button that shows the signed-in account
 *   2. User clicks → Google returns a credential (ID token)
 *   3. We send that token to POST /api/auth/google on our backend
 *   4. Backend verifies with Google, checks @iiitd.ac.in domain, issues our JWT
 */
function Login() {
  const [activeTab, setActiveTab] = useState('student')

  // Admin form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Google button state
  const [googleLoading, setGoogleLoading] = useState(false)

  const googleBtnRef = useRef(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  // ── Google Identity Services setup ──────────────────────────────────────
  // Runs whenever the student tab is active. Initializes the GSI library
  // and renders Google's button (which auto-shows the signed-in account).
  useEffect(() => {
    if (activeTab !== 'student') return

    const renderGoogleButton = () => {
      if (!window.google || !googleBtnRef.current) return

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      })

      // Clear any previous render before re-rendering
      googleBtnRef.current.innerHTML = ''

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleBtnRef.current.offsetWidth || 360,
        text: 'signin_with',
        logo_alignment: 'left',
        shape: 'rectangular',
      })
    }

    // GSI script loads async — wait for it if not ready yet
    if (window.google) {
      renderGoogleButton()
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          renderGoogleButton()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  // Called by Google with the ID token after user selects their account
  const handleGoogleCredential = async (response) => {
    setError('')
    setGoogleLoading(true)
    try {
      const res = await api.post('/api/auth/google', { credential: response.credential })
      const { token, user } = res.data.data
      login(user, token)
      navigate('/student/dashboard')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Google sign-in failed. Please try again.'
      setError(message)
    } finally {
      setGoogleLoading(false)
    }
  }

  // ── Student email/password login (kept for test accounts during testing phase) ──
  const handleStudentLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data.data
      login(user, token)
      navigate('/student/dashboard')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Admin email/password login ───────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data.data
      login(user, token)
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    setError('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-shell)]">
      {/* ===== LEFT PANEL: Branding (60%) ===== */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white lab-hero-panel">
        <div className="absolute inset-0 lab-grid-pattern opacity-60" />
        <div className="absolute inset-0 lab-illustration opacity-90" />
        <div className="absolute inset-y-0 right-0 w-px bg-cyan-300/20" />
        <div className="absolute top-20 right-16 h-24 w-24 border border-cyan-300/20 rounded-2xl rotate-6" />
        <div className="absolute bottom-28 left-12 h-40 w-40 border border-white/8 rounded-full" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-200/20 bg-white/6 px-4 py-2 text-xs font-semibold tracking-[0.28em] uppercase text-cyan-100 font-body">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
            CIPD | IIIT-Delhi | Lab Control
          </div>

          <div className="mt-10">
            <h1 className="font-heading text-5xl xl:text-6xl font-semibold leading-[1.02] text-white">
              Lab Inventory Management System
            </h1>
            <p className="mt-6 max-w-lg text-base xl:text-lg leading-8 text-slate-200/88 font-body">
              A central portal for managing lab equipment, inventory records, and authorized access.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-6 border-t border-white/10 pt-6 text-sm font-body text-slate-300/90">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Authorized access only
          </div>
          <div>Built for institute lab inventory workflows.</div>
        </div>
      </div>

      {/* ===== RIGHT PANEL: Login Form (42%) ===== */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-10 xl:p-12">
        <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-10">

          {/* Mobile-only branding */}
          <div className="lg:hidden mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 font-body">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              CIPD Lab Control
            </div>
            <h1 className="font-heading text-3xl font-semibold mt-4 text-slate-950">
              Inventory operations access
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-body">IIIT-Delhi laboratory inventory portal</p>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-semibold text-slate-950 mt-4">
              Sign in
            </h2>
            <p className="text-slate-500 mt-2 font-body leading-7">
              Use your institute credentials to continue.
            </p>
          </div>

          {/* ===== Tab Toggle ===== */}
          <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-6">
            <button
              type="button"
              onClick={() => switchTab('student')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold font-body transition-all duration-200 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Student Access
            </button>
            <button
              type="button"
              onClick={() => switchTab('admin')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold font-body transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Lab Admin Access
            </button>
          </div>

          {/* ===== Error message (shared) ===== */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 font-body flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* ===== STUDENT TAB: Google Sign-In + Email/Password ===== */}
          {activeTab === 'student' && (
            <div className="space-y-5">
              {/* Google renders its button here — shows signed-in account name */}
              <div className="relative">
                <div
                  ref={googleBtnRef}
                  className="w-full overflow-hidden rounded-2xl"
                  style={{ minHeight: '44px' }}
                />
                {googleLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                    <svg className="animate-spin h-5 w-5 text-cyan-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="ml-2 text-sm text-slate-600 font-body">Signing you in...</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-body">or sign in with email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Email/password form — kept for test accounts during testing phase */}
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label htmlFor="student-email" className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
                    Institute email
                  </label>
                  <input
                    id="student-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@iiitd.ac.in"
                    className="w-full px-4 py-3.5 border border-slate-200 bg-white rounded-2xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-slate-400"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="student-password" className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
                    Password
                  </label>
                  <input
                    id="student-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3.5 border border-slate-200 bg-white rounded-2xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-slate-400"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl text-white font-semibold text-sm font-body transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] shadow-[0_18px_40px_rgba(8,145,178,0.28)]"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Authenticating...
                    </span>
                  ) : 'Sign in'}
                </button>
              </form>

              <p className="text-sm text-center text-gray-500 font-body">
                Need student access?{' '}
                <a href="/signup" className="text-cyan-700 font-semibold hover:text-cyan-800 transition-colors">
                  Register with IIITD email
                </a>
              </p>
            </div>
          )}

          {/* ===== ADMIN TAB: Email + Password ===== */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
                  Admin email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cipd.iiitd.ac.in"
                  className="w-full px-4 py-3.5 border border-slate-200 bg-white rounded-2xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 border border-slate-200 bg-white rounded-2xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl text-white font-semibold text-sm font-body transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] shadow-[0_18px_40px_rgba(8,145,178,0.28)]"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  'Enter Admin Workspace'
                )}
              </button>

              <p className="text-sm text-center text-gray-400 font-body flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Admin accounts are provisioned by authorized lab staff
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
