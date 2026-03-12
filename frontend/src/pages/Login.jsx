import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

/**
 * Login page — the first page users see.
 *
 * Layout: Split screen
 *   Left (60%): Navy branding panel with CIPD Lab / IMS text + dot pattern
 *   Right (40%): White login card with Student/Admin toggle
 *
 * HOW IT WORKS (Phase 4):
 *   - Calls POST /api/auth/login with email + password
 *   - Server returns JWT token + user object
 *   - Token saved to localStorage, user saved to AuthContext
 *   - Navigate to student or admin dashboard based on role
 *   - Tab toggle is cosmetic — the server determines the actual role
 */
function Login() {
  const [activeTab, setActiveTab] = useState('student') // 'student' or 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data.data

      // Save to AuthContext + localStorage
      login(user, token)

      // Navigate based on role from server (not from the tab toggle)
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-shell)]">
      {/* ===== LEFT PANEL: Branding (60%) ===== */}
      <div
        className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white lab-hero-panel"
      >
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

      {/* ===== RIGHT PANEL: Login Form (40%) ===== */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-10 xl:p-12">
        <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-10">

          {/* Mobile-only branding (shown when left panel is hidden) */}
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

          {/* ===== Tab Toggle: Student | Admin ===== */}
          <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setError('') }}
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
              onClick={() => { setActiveTab('admin'); setError('') }}
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

          {/* ===== Login Form ===== */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
                Institute email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === 'student' ? 'name@iiitd.ac.in' : 'admin@cipd.iiitd.ac.in'}
                className="w-full px-4 py-3.5 border border-slate-200 bg-white rounded-2xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-slate-400"
                autoComplete="email"
              />
            </div>

            {/* Password */}
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

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 font-body flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Login Button */}
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
                `Enter ${activeTab === 'student' ? 'Student' : 'Admin'} Workspace`
              )}
            </button>
          </form>

          {/* ===== Footer Links ===== */}
          <div className="mt-6">
            <div className="text-center">
            {activeTab === 'student' ? (
              <p className="text-sm text-gray-500 font-body">
                Need student access?{' '}
                <Link to="/signup" className="text-cyan-700 font-semibold hover:text-cyan-800 transition-colors">
                  Register with IIITD email
                </Link>
              </p>
            ) : (
              <p className="text-sm text-gray-400 font-body flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Admin accounts are provisioned by authorized lab staff
              </p>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
