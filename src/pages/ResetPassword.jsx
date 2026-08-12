import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

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

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const email = params.get('email') || ''
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validate = () => {
    const e = {}
    if (!password) e.password = 'Password is required'
    else if (!PASSWORD_RULES.every(r => r.test(password))) e.password = 'Password does not meet all requirements'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await resetPassword(token, password)
      showToast('Password reset successful! Please log in.', 'success')
      navigate('/login')
    } catch (err) {
      setServerError(err?.response ? (err.response.data?.error || 'Password reset failed') : 'Cannot reach server — is it running on port 5001?')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        <div role="alert" className="mb-4 border border-amber-300 bg-amber-50 text-amber-800 rounded p-3 text-sm">
          This link is invalid or missing. Please request a new one.
        </div>
        <Link to="/forgot-password" className={`text-orange-700 font-medium ${FOCUS_RING}`}>Request a new reset link</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
      {email && <p className="text-sm text-gray-500 mb-6">Set a new password for <span className="font-medium">{email}</span>.</p>}
      {!email && <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>}

      {serverError && <div role="alert" className="mb-4 border border-red-300 bg-red-50 text-red-800 rounded p-3 text-sm">{serverError}</div>}

      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reset-pw">New Password</label>
          <div className="relative">
            <input
              id="reset-pw"
              className={`${INPUT} pr-14 ${errors.password ? INPUT_ERR : ''}`}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Enter new password"
              value={password}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'reset-pw-error' : undefined}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
            />
            <Eye open={showPw} onClick={() => setShowPw(p => !p)} />
          </div>
          {errors.password && <p id="reset-pw-error" role="alert" className="text-red-600 text-xs mt-1">{errors.password}</p>}
          <p className="text-xs text-gray-500 mt-1">At least 8 characters, with uppercase, lowercase, a number and a special character.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reset-confirm">Confirm New Password</label>
          <div className="relative">
            <input
              id="reset-confirm"
              className={`${INPUT} pr-14 ${errors.confirm ? INPUT_ERR : ''}`}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={confirm}
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? 'reset-confirm-error' : undefined}
              onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })) }}
            />
            <Eye open={showConfirm} onClick={() => setShowConfirm(p => !p)} />
          </div>
          {errors.confirm && <p id="reset-confirm-error" role="alert" className="text-red-600 text-xs mt-1">{errors.confirm}</p>}
        </div>
        <button className={BTN} disabled={loading} aria-label={loading ? 'Resetting password' : 'Reset password'}>
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>

      <p className="text-sm text-center text-gray-500 mt-6">
        <Link to="/login" className={`text-orange-700 font-medium ${FOCUS_RING}`}>Back to login</Link>
      </p>
    </div>
  )
}
