import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextInput from '../components/ui/TextInput'
import PasswordInput from '../components/ui/PasswordInput'
import api from '../utils/api'
import {
  validateRequired,
  validateMinLength,
  validateEmail,
  validatePassword,
  validateMatch,
} from '../utils/validation'

/**
 * Student Signup page.
 *
 * Layout: Same split design as Login — left navy branding, right white form.
 *
 * VALIDATION STRATEGY:
 *   - Per-field validation on blur (immediate feedback as you tab away)
 *   - Full validation on submit (catches anything you skipped)
 *   - Errors appear below each field in red
 *   - All rules are pure functions from utils/validation.js
 *
 * HOW IT WORKS (Phase 2 — no backend yet):
 *   If all fields are valid → show green success banner → redirect to /login after 2s.
 *   In Phase 4, this becomes a real POST /api/auth/signup call.
 *
 * WHO CAN SIGN UP:
 *   Only students with @iiitd.ac.in email addresses.
 *   Admin accounts are pre-approved — no signup for admins.
 */
function Signup() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Update a single field
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  // Validate a single field (called on blur)
  const validateField = (field) => {
    let error = null

    switch (field) {
      case 'name':
        error = validateRequired(form.name, 'Full name') || validateMinLength(form.name, 2, 'Full name')
        break
      case 'email':
        error = validateEmail(form.email)
        break
      case 'password':
        error = validatePassword(form.password)
        break
      case 'confirmPassword':
        error = validateRequired(form.confirmPassword, 'Confirm password') ||
                validateMatch(form.confirmPassword, form.password, 'Passwords')
        break
    }

    setErrors((prev) => ({ ...prev, [field]: error }))
    return error
  }

  // Validate all fields (called on submit)
  const validateAll = () => {
    const newErrors = {
      name: validateRequired(form.name, 'Full name') || validateMinLength(form.name, 2, 'Full name'),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword:
        validateRequired(form.confirmPassword, 'Confirm password') ||
        validateMatch(form.confirmPassword, form.password, 'Passwords'),
    }

    setErrors(newErrors)

    // Return true if no errors
    return !Object.values(newErrors).some((e) => e !== null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateAll()) return

    setIsLoading(true)
    try {
      await api.post('/api/auth/signup', {
        name: form.name,
        email: form.email,
        password: form.password,
      })

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Signup failed. Please try again.'
      setErrors({ submit: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-shell)]">
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
            Student registration only
          </div>
          <div>Built for institute lab inventory workflows.</div>
        </div>
      </div>

      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-10 xl:p-12">
        <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-10">
          <div className="lg:hidden mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 font-body">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              CIPD Lab Control
            </div>
            <h1 className="font-heading text-3xl font-semibold mt-4 text-slate-950">
              Student registration
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-body">IIIT-Delhi laboratory inventory portal</p>
          </div>

          <div className="mb-8">
            <h2 className="font-heading text-3xl font-semibold text-slate-950">Create student account</h2>
            <p className="text-slate-500 mt-2 font-body leading-7">
              Register with your IIIT-Delhi email to access CIPD lab inventory services.
            </p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm font-body flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Account created! Redirecting to login...
            </div>
          )}

          {errors.submit && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-body flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              label="Full Name"
              id="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              onBlur={() => validateField('name')}
              placeholder="Abhinav Gupta"
              error={errors.name}
              required
              autoComplete="name"
            />

            <TextInput
              label="Institute Email"
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => validateField('email')}
              placeholder="name@iiitd.ac.in"
              error={errors.email}
              required
              autoComplete="email"
            />

            <PasswordInput
              label="Password"
              id="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              onBlur={() => validateField('password')}
              placeholder="Minimum 6 characters"
              error={errors.password}
              required
              showStrength
              autoComplete="new-password"
            />

            <PasswordInput
              label="Confirm Password"
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              onBlur={() => validateField('confirmPassword')}
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3.5 px-4 rounded-2xl text-white font-semibold text-sm font-body transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] shadow-[0_18px_40px_rgba(8,145,178,0.28)]"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Student Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 font-body">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-700 font-semibold hover:text-cyan-800 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
