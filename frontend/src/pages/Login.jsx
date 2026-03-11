import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Login page — the first page users see.
 *
 * Layout: Split screen
 *   Left (60%): Navy branding panel with CIPD Lab / IMS text + dot pattern
 *   Right (40%): White login card with Student/Admin toggle
 *
 * HOW IT WORKS (Phase 1 — no backend yet):
 *   - Toggle between Student and Admin tabs
 *   - Fill email + password
 *   - Click Login → shows alert (backend not connected)
 *   - "Create account" link on Student tab → navigates to /signup
 *
 * WHAT CHANGES IN PHASE 4:
 *   - Login button will call POST /api/auth/login
 *   - On success: navigate to /student/dashboard or /admin/dashboard
 *   - On fail: show error from API response
 */
function Login() {
  const [activeTab, setActiveTab] = useState('student') // 'student' or 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    // Phase 1: No backend — show a message
    // This gets replaced with a real API call in Phase 4
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setError('Backend not connected yet — coming in Phase 4!')
    }, 800)
  }

  return (
    <div className="min-h-screen flex">
      {/* ===== LEFT PANEL: Branding (60%) ===== */}
      <div
        className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col justify-center items-center text-white p-12"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern" />

        {/* Decorative gradient blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5), transparent)' }}
        />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent)' }}
        />

        {/* Main branding text */}
        <div className="relative z-10 text-center max-w-lg">
          <h1 className="font-heading text-6xl font-bold mb-3 leading-tight">
            CIPD Lab
          </h1>
          <h2 className="font-heading text-3xl font-semibold mb-6 text-blue-200">
            Inventory Management System
          </h2>
          <div className="w-20 h-0.5 bg-blue-400 mx-auto mb-6 opacity-60" />
          <p className="text-blue-200 text-lg font-body leading-relaxed">
            IIITD — Indraprastha Institute of<br />
            Information Technology Delhi
          </p>
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-8 left-12 right-12 flex items-center gap-3 opacity-30">
          <div className="h-px flex-1 bg-white" />
          <span className="text-xs tracking-widest uppercase font-body">Secure Inventory Portal</span>
          <div className="h-px flex-1 bg-white" />
        </div>
      </div>

      {/* ===== RIGHT PANEL: Login Form (40%) ===== */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile-only branding (shown when left panel is hidden) */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              CIPD Lab IMS
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-body">IIITD Inventory Management</p>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1 font-body">Sign in to your account to continue</p>
          </div>

          {/* ===== Tab Toggle: Student | Admin ===== */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setError('') }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold font-body transition-all duration-200 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setError('') }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold font-body transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {/* Lock icon for admin */}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin
            </button>
          </div>

          {/* ===== Login Form ===== */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === 'student' ? 'name@iiitd.ac.in' : 'admin@cipd.iiitd.ac.in'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                autoComplete="current-password"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-body flex items-start gap-2">
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
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm font-body transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  {/* Spinner */}
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                `Sign in as ${activeTab === 'student' ? 'Student' : 'Admin'}`
              )}
            </button>
          </form>

          {/* ===== Footer Links ===== */}
          <div className="mt-6 text-center">
            {activeTab === 'student' ? (
              <p className="text-sm text-gray-500 font-body">
                New here?{' '}
                <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                  Create account
                </Link>
              </p>
            ) : (
              <p className="text-sm text-gray-400 font-body flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Admin accounts are pre-approved
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
