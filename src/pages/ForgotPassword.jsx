import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AuthShell from '../components/AuthShell'

const BTN = 'bg-orange-600 text-white p-3 rounded font-medium hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
const INPUT = 'border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition-colors'
const INPUT_ERR = 'border-red-400 focus:ring-red-500/40 focus:border-red-500'
const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-orange-500 rounded'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState('')

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email or username is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      const data = await forgotPassword(email)
      setSent(true)
      setDevLink(data?.devLink || '')
      showToast('If an account exists, a reset link has been sent.', 'success')
    } catch (err) {
      const msg = err?.response ? (err.response.data?.error || 'Request failed') : 'Cannot reach server - is it running on port 5001?'
      setServerError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getRelativeDevLink = (url) => {
    try {
      if (url.startsWith('http')) {
        const u = new URL(url)
        return u.pathname + u.search
      }
      return url
    } catch {
      return url
    }
  }

  return (
    <AuthShell title="Forgot Password" subtitle="Enter your email or username and we'll send you a reset link.">
      {serverError && (
        <div role="alert" className="mb-4 border border-red-300 bg-red-50 text-red-800 rounded p-3 text-sm">
          {serverError}
        </div>
      )}
      {sent ? (
        <div role="alert" className="mb-4 border border-green-300 bg-green-50 text-green-800 rounded p-3 text-sm">
          If an account exists for that email, a password reset link has been sent. Check your inbox.
          {devLink && (
            <div className="mt-3 p-3 bg-white border border-green-200 rounded">
              <p className="text-xs text-gray-500 font-semibold mb-1">Development / Demo Reset Link:</p>
              <Link to={getRelativeDevLink(devLink)} className="block text-orange-700 font-medium underline break-all text-xs">
                {devLink}
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => { setSent(false); setDevLink('') }}
            className="mt-3 text-xs text-orange-700 hover:text-orange-800 font-medium underline block"
          >
            Send another reset link
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="forgot-email">Email or Username</label>
            <input
              id="forgot-email"
              className={`${INPUT} ${errors.email ? INPUT_ERR : ''}`}
              type="text"
              autoComplete="username"
              placeholder="you@example.com or username"
              value={email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'forgot-email-error' : undefined}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); setServerError('') }}
            />
            {errors.email && <p id="forgot-email-error" role="alert" className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>
          <button className={BTN} disabled={loading} aria-label={loading ? 'Sending reset link' : 'Send reset link'}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-sm text-center text-gray-500 mt-6">
        Remembered your password?{' '}
        <Link to="/login" className={`text-orange-700 font-medium ${FOCUS_RING}`}>Back to login</Link>
      </p>
    </AuthShell>
  )
}
