import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const BTN = 'bg-orange-500 text-white p-3 rounded font-medium hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ login: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.login.trim()) e.login = 'Email or username is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(form.login, form.password)
      showToast('Welcome back!', 'success')
      navigate('/')
    } catch {
      showToast('Invalid email/username or password', 'error')
    } finally {
      setLoading(false)
    }
  }

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
      <h1 className="text-2xl font-bold mb-1">Login</h1>
      <p className="text-sm text-gray-500 mb-6">Welcome back! Sign in to your account.</p>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block" htmlFor="login-field">Email or Username</label>
          <input id="login-field" className={`border p-2 rounded w-full ${errors.login ? 'border-red-400' : ''}`} type="text" placeholder="you@example.com or username" value={form.login} onChange={e => { setForm(p => ({ ...p, login: e.target.value })); setErrors(p => ({ ...p, login: '' })) }} />
          {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="login-pw">Password</label>
            <Link to="/forgot-password" className="text-xs text-orange-500 hover:text-orange-600">Forgot password?</Link>
          </div>
          <div className="relative">
            <input id="login-pw" className={`border p-2 rounded w-full pr-9 ${errors.password ? 'border-red-400' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }} />
            <Eye open={showPw} onClick={() => setShowPw(p => !p)} />
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
        <button className={BTN} disabled={loading} aria-label="Login">{loading ? 'Logging in...' : 'Login'}</button>
        <p className="text-sm text-center text-gray-500">Don't have an account? <Link to="/register" className="text-orange-500 font-medium">Create one here</Link></p>
        <p className="text-xs text-center text-gray-400">
          By logging in you agree to our{' '}
          <Link to="/terms" className="text-orange-500 underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-orange-500 underline">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  )
}