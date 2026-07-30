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

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [agree, setAgree] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!EMAIL_RE.test(form.email)) e.email = 'Invalid email format'
    if (!form.password) e.password = 'Password is required'
    else if (!PASSWORD_RULES.every(r => r.test(form.password))) e.password = 'Password does not meet all requirements'
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

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
          <input className={`border p-2 rounded w-full ${errors.name ? 'border-red-400' : ''}`} placeholder="John Doe" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })) }} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
          <input className={`border p-2 rounded w-full ${errors.email ? 'border-red-400' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })) }} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
          <input className={`border p-2 rounded w-full ${errors.password ? 'border-red-400' : ''}`} type="password" placeholder="Create a strong password" value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          {form.password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-1.5 flex-1 rounded ${strengthColor}`} style={{ width: `${(strength / PASSWORD_RULES.length) * 100}%` }} />
                <span className="text-xs text-gray-500">{strengthLabel}</span>
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

        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setErrors(p => ({ ...p, agree: '' })) }} className="mt-0.5 accent-orange-500" />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="text-orange-500 underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-orange-500 underline">Privacy Policy</Link>
          </span>
        </label>
        {errors.agree && <p className="text-red-500 text-xs -mt-2">{errors.agree}</p>}

        <button className="bg-orange-500 text-white p-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || !agree} aria-label="Register">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By registering you confirm that you are at least 16 years old and accept our{' '}
          <Link to="/terms" className="text-orange-500 underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-orange-500 underline">Privacy Policy</Link>.
        </p>

        <p className="text-sm text-center text-gray-500">
          Already have an account? <Link to="/login" className="text-orange-500">Login</Link>
        </p>
      </form>
    </div>
  )
}