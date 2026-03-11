/**
 * Validation utility — pure functions for form validation.
 *
 * WHY PURE FUNCTIONS?
 *   Each function takes a value and returns either null (valid) or an error string.
 *   This makes them:
 *   - Easy to test (no side effects)
 *   - Reusable across Signup, Login, Admin forms, etc.
 *   - Composable (chain multiple validators on one field)
 *
 * IMPORTANT: Client-side validation is for UX only.
 *   The backend MUST re-validate everything. A user can bypass frontend
 *   validation by sending requests directly to the API.
 */

/**
 * Check if value is non-empty after trimming whitespace.
 * @param {string} value
 * @param {string} fieldName - Human-readable name for error message
 * @returns {string|null} Error message or null if valid
 */
export function validateRequired(value, fieldName = 'This field') {
  if (!value || !value.trim()) {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Check minimum length.
 */
export function validateMinLength(value, min, fieldName = 'This field') {
  if (value && value.trim().length < min) {
    return `${fieldName} must be at least ${min} characters`
  }
  return null
}

/**
 * Validate email is a proper IIITD email address.
 *
 * HOW THE REGEX WORKS:
 *   /^[a-zA-Z0-9._%+-]+@iiitd\.ac\.in$/i
 *   ^                  - start of string
 *   [a-zA-Z0-9._%+-]+  - one or more valid email characters before @
 *   @iiitd\.ac\.in     - literal @iiitd.ac.in (dots escaped)
 *   $                  - end of string
 *   /i                 - case insensitive
 *
 * TO ADD A NEW ALLOWED DOMAIN:
 *   Change the regex to: /@(iiitd\.ac\.in|newdomain\.com)$/i
 *   Or better: make ALLOWED_DOMAINS an array and check with .some()
 */
const IIITD_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@iiitd\.ac\.in$/i

export function validateEmail(value) {
  if (!value || !value.trim()) {
    return 'Email is required'
  }
  if (!IIITD_EMAIL_REGEX.test(value.trim())) {
    return 'Must be an IIITD email address (@iiitd.ac.in)'
  }
  return null
}

/**
 * Validate password meets minimum requirements.
 */
export function validatePassword(value) {
  if (!value) {
    return 'Password is required'
  }
  if (value.length < 6) {
    return 'Password must be at least 6 characters'
  }
  return null
}

/**
 * Check that two values match (used for confirm password).
 */
export function validateMatch(value, compareValue, fieldName = 'Values') {
  if (value !== compareValue) {
    return `${fieldName} do not match`
  }
  return null
}

/**
 * Get a simple password strength score.
 * Returns 'weak' | 'medium' | 'strong'
 */
export function getPasswordStrength(password) {
  if (!password || password.length < 6) return 'weak'

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return 'weak'
  if (score <= 3) return 'medium'
  return 'strong'
}
