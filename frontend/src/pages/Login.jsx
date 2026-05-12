import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

function Login() {
  const [activeTab, setActiveTab] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const googleBtnRef = useRef(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Initialize Google Identity Services whenever student tab is shown
  useEffect(() => {
    if (activeTab !== 'student') return

    const render = () => {
      if (!window.google || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      })
      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'signin_with',
        logo_alignment: 'left',
        shape: 'rectangular',
      })
    }

    if (window.google) {
      render()
    } else {
      const t = setInterval(() => { if (window.google) { clearInterval(t); render() } }, 100)
      return () => clearInterval(t)
    }
  }, [activeTab])

  const handleGoogleCredential = async (response) => {
    setError('')
    setGoogleLoading(true)
    try {
      const res = await api.post('/api/auth/google', { credential: response.credential })
      const { token, user } = res.data.data
      login(user, token)
      navigate('/student/dashboard')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Google sign-in failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleStudentLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return }
    setIsLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      login(data.data.user, data.data.token)
      navigate('/student/dashboard')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return }
    setIsLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      login(data.data.user, data.data.token)
      navigate(data.data.user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const switchTab = (tab) => { setActiveTab(tab); setError(''); setEmail(''); setPassword('') }

  return (
    <div className="min-h-screen flex bg-[var(--color-shell)]">

      {/* ── Left branding panel ── */}
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
              Lab Inventory<br />Management System
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

      {/* ── Right login panel ── */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-10 xl:p-12">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white px-7 py-9 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-9 sm:py-10">

          {/* Mobile-only branding */}
          <div className="lg:hidden mb-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 font-body">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              CIPD Lab Control
            </div>
            <h1 className="font-heading text-2xl font-semibold mt-3 text-slate-950">Inventory operations access</h1>
            <p className="text-slate-500 text-sm mt-1 font-body">IIIT-Delhi laboratory inventory portal</p>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="font-heading text-[28px] font-semibold text-slate-950">Sign in</h2>
            <p className="text-slate-500 mt-1.5 text-sm font-body">Use your institute credentials to continue.</p>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchTab('student')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold font-body transition-all duration-200 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => switchTab('admin')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold font-body transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-body flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Student tab ── */}
          {activeTab === 'student' && (
            <div className="space-y-5">

              {/* Google button — centered so GSI's iframe sits flush */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-[360px]">
                  <div ref={googleBtnRef} style={{ minHeight: '44px' }} />
                  {googleLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-sm">
                      <svg className="animate-spin h-5 w-5 text-cyan-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="ml-2 text-sm text-slate-500 font-body">Signing you in…</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-body">
                  Only <span className="font-mono">@iiitd.ac.in</span> accounts are accepted
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[11px] text-slate-400 font-body uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Email / password — for test accounts */}
              <form onSubmit={handleStudentLogin} className="space-y-3.5">
                <div>
                  <label htmlFor="s-email" className="block text-xs font-medium text-slate-500 mb-1.5 font-body uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    id="s-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@iiitd.ac.in"
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-300"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="s-password" className="block text-xs font-medium text-slate-500 mb-1.5 font-body uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    id="s-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-300"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm font-body transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' }}
                >
                  {isLoading
                    ? <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing in…
                      </span>
                    : 'Sign in with email'
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── Admin tab ── */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label htmlFor="a-email" className="block text-xs font-medium text-slate-500 mb-1.5 font-body uppercase tracking-wide">
                  Admin email
                </label>
                <input
                  id="a-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin email address"
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-300"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="a-password" className="block text-xs font-medium text-slate-500 mb-1.5 font-body uppercase tracking-wide">
                  Password
                </label>
                <input
                  id="a-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-300"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm font-body transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' }}
              >
                {isLoading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating…
                    </span>
                  : 'Enter Admin Workspace'
                }
              </button>
              <p className="text-xs text-center text-slate-400 font-body flex items-center justify-center gap-1.5 pt-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
