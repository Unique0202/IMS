/**
 * Reusable text input with label, error display, and required indicator.
 *
 * WHY A REUSABLE COMPONENT?
 *   Every form in the app (Signup, Login, Add Item, Decline Reason, etc.)
 *   needs inputs with labels and error messages. Instead of copy-pasting
 *   the same JSX 20 times, we extract it once. If we change the styling,
 *   it updates everywhere.
 *
 * Props:
 *   label       - Text label above the input
 *   id          - HTML id (also used for htmlFor on label)
 *   type        - Input type (text, email, etc.) Default: "text"
 *   value       - Controlled value
 *   onChange     - Change handler
 *   onBlur      - Blur handler (for validate-on-blur)
 *   placeholder - Placeholder text
 *   error       - Error message string (shown in red below input)
 *   required    - Shows a red asterisk next to label
 *   autoComplete - Browser autocomplete hint
 */
function TextInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  autoComplete,
}) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-4 py-3 border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400 ${
          error
            ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
            : 'border-gray-200 focus:ring-blue-500'
        }`}
      />
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

export default TextInput
