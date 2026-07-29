import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      showToast('Logged in successfully', 'success')
      navigate(from, { replace: true })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input className="border p-2 rounded" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label className="text-sm font-medium text-gray-700">Password</label>
        <input className="border p-2 rounded" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button disabled={loading} className="bg-orange-500 text-white p-2 rounded disabled:opacity-50" type="submit">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-3 text-sm text-gray-600">
        No account? <Link to="/register" className="text-orange-500 font-medium">Register</Link>
      </p>
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
        <p className="font-medium mb-1">Test accounts:</p>
        <p>Customer: john@test.com / password</p>
        <p>Owner: owner@test.com / password</p>
        <p>Rider: rider@test.com / password</p>
        <p>Admin: admin@test.com / password</p>
      </div>
    </div>
  )
}
