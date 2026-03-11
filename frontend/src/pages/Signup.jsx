import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextInput from '../components/ui/TextInput'
import PasswordInput from '../components/ui/PasswordInput'
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

    // Phase 2: No backend — simulate success
    // In Phase 4, this becomes: await api.post('/api/auth/signup', { name, email, password })
    setTimeout(() => {
      setIsLoading(false)
      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }, 800)
  }

  return (
    <div className="min-h-screen flex">
      {/* ===== LEFT PANEL: Branding (same as Login) ===== */}
      <div
        className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col justify-center items-center text-white p-12"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div className="absolute inset-0 dot-pattern" />

        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5), transparent)' }}
        />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent)' }}
        />

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

        <div className="absolute bottom-8 left-12 right-12 flex items-center gap-3 opacity-30">
          <div className="h-px flex-1 bg-white" />
          <span className="text-xs tracking-widest uppercase font-body">Secure Inventory Portal</span>
          <div className="h-px flex-1 bg-white" />
        </div>
      </div>

      {/* ===== RIGHT PANEL: Signup Form ===== */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile-only branding */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              CIPD Lab IMS
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-body">IIITD Inventory Management</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-1 font-body">Sign up with your IIITD email to get started</p>
          </div>

          {/* Success message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-body flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Account created! Redirecting to login...
            </div>
          )}

          {/* ===== Signup Form ===== */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
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

            {/* Email */}
            <TextInput
              label="Email"
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

            {/* Password */}
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

            {/* Confirm Password */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm font-body transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--color-primary)' }}
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
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 font-body">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
