import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

const BTN = 'bg-orange-600 text-white p-3 rounded font-medium hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
const INPUT = 'border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition-colors'
const INPUT_ERR = 'border-red-400 focus:ring-red-500/40 focus:border-red-500'
const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-orange-500 rounded'

function Eye({ open, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors ${FOCUS_RING}`} tabIndex={-1} aria-label={open ? 'Hide password' : 'Show password'}>
      {open ? (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      ) : (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      )}
    </button>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ firstName: '', middleName: '', lastName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agree, setAgree] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!EMAIL_RE.test(form.email)) e.email = 'Invalid email format'
    if (!form.password) e.password = 'Password is required'
    else if (!PASSWORD_RULES.every(r => r.test(form.password))) e.password = 'Password does not meet all requirements'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    if (!agree) e.agree = 'You must agree to the terms'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fullName = [form.firstName.trim(), form.middleName.trim(), form.lastName.trim()].filter(Boolean).join(' ')
      const data = await register(fullName, form.email, form.password)
      showToast('Account created! Check your email to verify.', 'success')
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`)
      if (data?.devLink) {
        setTimeout(() => showToast(`Dev link: ${data.devLink}`, 'info'), 500)
      }
    } catch (err) {
      const msg = err?.response ? (err.response.data?.error || 'Registration failed') : 'Cannot reach server — is it running on port 5001?'
      showToast(msg, 'error')
      console.error('Register error:', err)
    } finally {
      setLoading(false)
    }
  }

  const strength = PASSWORD_RULES.filter(r => r.test(form.password)).length
  const strengthColor = ['bg-red-600', 'bg-red-500', 'bg-yellow-400', 'bg-yellow-300', 'bg-green-500', 'bg-green-600'][strength]
  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength]

  const confirmMatch = form.confirm.length > 0 && form.password === form.confirm
  const confirmMismatch = form.confirm.length > 0 && form.password !== form.confirm

  const strengthId = 'reg-pw-strength'

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <form onSubmit={handleSubmit} className="grid gap-4" aria-busy={loading} noValidate>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-first">First</label>
            <input
              id="reg-first"
              className={`${INPUT} ${errors.firstName ? INPUT_ERR : ''}`}
              autoComplete="given-name"
              placeholder="John"
              value={form.firstName}
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'reg-first-error' : undefined}
              onChange={e => { setForm(p => ({ ...p, firstName: e.target.value })); setErrors(p => ({ ...p, firstName: '' })) }}
            />
            {errors.firstName && <p id="reg-first-error" role="alert" className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-middle">Middle</label>
            <input
              id="reg-middle"
              className={INPUT}
              autoComplete="additional-name"
              placeholder="(opt)"
              value={form.middleName}
              onChange={e => { setForm(p => ({ ...p, middleName: e.target.value })) }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-last">Last</label>
            <input
              id="reg-last"
              className={`${INPUT} ${errors.lastName ? INPUT_ERR : ''}`}
              autoComplete="family-name"
              placeholder="Doe"
              value={form.lastName}
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'reg-last-error' : undefined}
              onChange={e => { setForm(p => ({ ...p, lastName: e.target.value })); setErrors(p => ({ ...p, lastName: '' })) }}
            />
            {errors.lastName && <p id="reg-last-error" role="alert" className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-email">Email Address</label>
          <input
            id="reg-email"
            className={`${INPUT} ${errors.email ? INPUT_ERR : ''}`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'reg-email-error' : undefined}
            onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })) }}
          />
          {errors.email && <p id="reg-email-error" role="alert" className="text-red-600 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-pw">Password</label>
          <div className="relative">
            <input
              id="reg-pw"
              className={`${INPUT} pr-14 ${errors.password ? INPUT_ERR : ''}`}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={form.password}
              aria-invalid={!!errors.password}
              aria-describedby={[errors.password ? 'reg-pw-error' : '', form.password ? strengthId : ''].filter(Boolean).join(' ') || undefined}
              onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }}
            />
            <Eye open={showPw} onClick={() => setShowPw(p => !p)} />
          </div>
          {errors.password && <p id="reg-pw-error" role="alert" className="text-red-600 text-xs mt-1">{errors.password}</p>}
          {form.password && (
            <div id={strengthId} className="mt-2" role="status" aria-live="polite">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1.5 flex-1 rounded bg-gray-200 overflow-hidden">
                  <div className={`h-full rounded transition-all ${strengthColor}`} style={{ width: `${(strength / PASSWORD_RULES.length) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">{strengthLabel}</span>
              </div>
              <ul className="space-y-0.5">
                {PASSWORD_RULES.map(r => {
                  const ok = r.test(form.password)
                  return (
                    <li key={r.label} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-700' : 'text-gray-400'}`}>
                      <span aria-hidden="true">{ok ? '✓' : '○'}</span> {r.label}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-confirm">Confirm Password</label>
          <div className="relative">
            <input
              id="reg-confirm"
              className={`${INPUT} pr-14 ${errors.confirm ? INPUT_ERR : ''}`}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={form.confirm}
              aria-invalid={!!errors.confirm || confirmMismatch}
              aria-describedby={[errors.confirm ? 'reg-confirm-error' : '', confirmMatch ? 'reg-confirm-match' : '', confirmMismatch ? 'reg-confirm-mismatch' : ''].filter(Boolean).join(' ') || undefined}
              onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: '' })) }}
            />
            <Eye open={showConfirm} onClick={() => setShowConfirm(p => !p)} />
          </div>
          {errors.confirm && <p id="reg-confirm-error" role="alert" className="text-red-600 text-xs mt-1">{errors.confirm}</p>}
          {confirmMatch && (
            <p id="reg-confirm-match" className="text-xs mt-1 flex items-center gap-1 text-green-700"><span aria-hidden="true">✓</span> Passwords match</p>
          )}
          {confirmMismatch && (
            <p id="reg-confirm-mismatch" className="text-xs mt-1 flex items-center gap-1 text-red-600" role="alert"><span aria-hidden="true">✗</span> Passwords do not match</p>
          )}
        </div>

        <label className="flex items-start gap-3 py-2 cursor-pointer text-sm text-gray-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={e => { setAgree(e.target.checked); setErrors(p => ({ ...p, agree: '' })) }}
            className="mt-0.5 accent-orange-500 shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
            aria-invalid={!!errors.agree}
            aria-describedby={errors.agree ? 'reg-agree-error' : undefined}
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className={`text-orange-700 underline ${FOCUS_RING}`}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className={`text-orange-700 underline ${FOCUS_RING}`}>Privacy Policy</Link>
            {' '}(I am at least 16 years old).
          </span>
        </label>
        {errors.agree && <p id="reg-agree-error" role="alert" className="text-red-600 text-xs -mt-2">{errors.agree}</p>}

        <button className={BTN} disabled={loading || !agree} aria-label={loading ? 'Creating account' : 'Register'}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className={`text-orange-700 font-medium ${FOCUS_RING}`}>Login</Link>
        </p>
      </form>
    </div>
  )
}