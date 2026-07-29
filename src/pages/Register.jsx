import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(name, email, password)
      showToast('Account created!', 'success')
      navigate('/')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Name</label>
        <input className="border p-2 rounded" type="text" value={name} onChange={e => setName(e.target.value)} required />
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input className="border p-2 rounded" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label className="text-sm font-medium text-gray-700">Password</label>
        <input className="border p-2 rounded" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button disabled={loading} className="bg-orange-500 text-white p-2 rounded disabled:opacity-50" type="submit">
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="mt-3 text-sm text-gray-600">
        Have an account? <Link to="/login" className="text-orange-500 font-medium">Login</Link>
      </p>
    </div>
  )
}
