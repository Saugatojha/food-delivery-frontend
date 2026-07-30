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

const BTN = 'bg-orange-500 text-white p-3 rounded font-medium hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agree, setAgree] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
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
      await register(form.name, form.email, form.password)
      showToast('Account created!', 'success')
      navigate('/')
    } catch (err) {
      showToast(err?.response?.data?.error || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const strength = PASSWORD_RULES.filter(r => r.test(form.password)).length
  const strengthColor = ['bg-red-500', 'bg-red-400', 'bg-yellow-400', 'bg-yellow-300', 'bg-green-400', 'bg-green-500'][strength]
  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength]

  const Eye = ({ open, onClick }) => (
    <button type="button" onClick={onClick} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1" tabIndex={-1} aria-label={open ? 'Hide password' : 'Show password'}>
      {open ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      )}
    </button>
  )

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-name">Full Name</label>
          <input id="reg-name" className={`border p-2 rounded w-full ${errors.name ? 'border-red-400' : ''}`} placeholder="John Doe" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })) }} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-email">Email Address</label>
          <input id="reg-email" className={`border p-2 rounded w-full ${errors.email ? 'border-red-400' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })) }} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="reg-pw">Password</label>
          <div className="relative">
            <input id="reg-pw" className={`border p-2 rounded w-full pr-9 ${errors.password ? 'border-red-400' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Create a strong password" value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }} />
            <Eye open={showPw} onClick={() => setShowPw(p => !p)} />
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          {form.password && (
            <div className="mt-2">
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
                    <li key={r.label} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{ok ? '✓' : '○'}</span> {r.label}
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
            <input id="reg-confirm" className={`border p-2 rounded w-full pr-9 ${errors.confirm ? 'border-red-400' : ''}`} type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password" value={form.confirm} onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: '' })) }} />
            <Eye open={showConfirm} onClick={() => setShowConfirm(p => !p)} />
          </div>
          {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
        </div>

        <label className="flex items-start gap-3 py-1 cursor-pointer text-sm text-gray-600">
          <input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setErrors(p => ({ ...p, agree: '' })) }} className="mt-0.5 accent-orange-500 shrink-0" />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="text-orange-500 underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-orange-500 underline">Privacy Policy</Link>
            {' '}(I am at least 16 years old).
          </span>
        </label>
        {errors.agree && <p className="text-red-500 text-xs -mt-2">{errors.agree}</p>}

        <button className={BTN} disabled={loading || !agree} aria-label="Register">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-sm text-center text-gray-500">
          Already have an account? <Link to="/login" className="text-orange-500 font-medium">Login</Link>
        </p>
      </form>
    </div>
  )
}