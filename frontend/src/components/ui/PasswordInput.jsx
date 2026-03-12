import { useState } from 'react'
import { getPasswordStrength } from '../../utils/validation'

/**
 * Password input with show/hide toggle and optional strength indicator.
 *
 * Props:
 *   label        - Text label
 *   id           - HTML id
 *   value        - Controlled value
 *   onChange      - Change handler
 *   onBlur       - Blur handler
 *   placeholder  - Placeholder text
 *   error        - Error message string
 *   required     - Shows red asterisk
 *   showStrength - If true, shows a colored strength bar below input
 *   autoComplete - Browser autocomplete hint
 */
function PasswordInput({
  label,
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'Enter password',
  error,
  required = false,
  showStrength = false,
  autoComplete = 'new-password',
}) {
  const [visible, setVisible] = useState(false)

  const strength = showStrength && value ? getPasswordStrength(value) : null

  const strengthConfig = {
    weak: { width: '33%', color: 'bg-red-400', label: 'Weak' },
    medium: { width: '66%', color: 'bg-yellow-400', label: 'Medium' },
    strong: { width: '100%', color: 'bg-green-500', label: 'Strong' },
  }

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input with eye toggle button */}
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full px-4 py-3.5 pr-11 border rounded-2xl text-sm font-body bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-slate-400 ${
            error
              ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
              : 'border-slate-200 focus:ring-cyan-500'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            // Eye-off icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            // Eye icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Strength bar */}
      {showStrength && strength && (
        <div className="mt-2">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${strengthConfig[strength].color} rounded-full transition-all duration-300`}
              style={{ width: strengthConfig[strength].width }}
            />
          </div>
          <p className={`text-xs mt-1 font-body ${
            strength === 'weak' ? 'text-red-500' :
            strength === 'medium' ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {strengthConfig[strength].label}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-body flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export default PasswordInput
