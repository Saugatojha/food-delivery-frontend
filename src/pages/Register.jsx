import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return showToast('Fill in all fields', 'error')
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

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input className="border p-2 rounded" placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <input className="border p-2 rounded" type="email" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <input className="border p-2 rounded" type="password" placeholder="Password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        <button className="bg-orange-500 text-white p-3 rounded font-medium disabled:opacity-50" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
        <p className="text-sm text-center text-gray-500">Already have an account? <Link to="/login" className="text-orange-500">Login</Link></p>
      </form>
    </div>
  )
}
