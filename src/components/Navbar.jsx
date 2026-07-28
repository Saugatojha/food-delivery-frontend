import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-orange-500 text-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold">Smart Serve</Link>
      <div className="flex gap-4 items-center">
        <Link to="/cart">Cart</Link>
        {user ? (
          <>
            <Link to="/orders">Orders</Link>
            <span>{user.name}</span>
            <button onClick={logout} className="bg-white text-orange-500 px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
