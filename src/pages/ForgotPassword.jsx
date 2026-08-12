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
    try {
      const data = await forgotPassword(email)
      setSent(true)
      setDevLink(data?.devLink || '')
      showToast('If an account exists, a reset link has been sent.', 'success')
    } catch (err) {
      showToast(err?.response ? (err.response.data?.error || 'Request failed') : 'Cannot reach server - is it running on port 5001?', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Forgot Password" subtitle="Enter your email or username and we'll send you a reset link.">
      {sent ? (
        <div role="alert" className="mb-4 border border-green-300 bg-green-50 text-green-800 rounded p-3 text-sm">
          If an account exists for that email, a password reset link has been sent. Check your inbox.
          {devLink && (
            <a href={devLink} className="block mt-2 text-orange-700 font-medium underline break-all">{devLink}</a>
          )}
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
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
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
