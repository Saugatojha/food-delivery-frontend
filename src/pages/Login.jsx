import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      alert('Login failed. Check credentials.')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className="border p-2 rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="border p-2 rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="bg-orange-500 text-white p-2 rounded" type="submit">Login</button>
      </form>
      <p className="mt-3">No account? <Link to="/register" className="text-orange-500">Register</Link></p>
    </div>
  )
}
