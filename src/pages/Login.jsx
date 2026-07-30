import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ login: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.login.trim()) e.login = 'Email or username is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 4) e.password = 'Min 4 characters'
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

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-1">Login</h1>
      <p className="text-sm text-gray-500 mb-6">Welcome back! Sign in to your account.</p>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email or Username</label>
          <input className={`border p-2 rounded w-full ${errors.login ? 'border-red-400' : ''}`} type="text" placeholder="you@example.com or username" value={form.login} onChange={e => { setForm(p => ({ ...p, login: e.target.value })); setErrors(p => ({ ...p, login: '' })) }} />
          {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
          <input className={`border p-2 rounded w-full ${errors.password ? 'border-red-400' : ''}`} type="password" placeholder="Enter your password" value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
        <button className="bg-orange-500 text-white p-3 rounded font-medium disabled:opacity-50" disabled={loading} aria-label="Login">{loading ? 'Logging in...' : 'Login'}</button>
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