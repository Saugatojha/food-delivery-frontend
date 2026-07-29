import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleLinks = {
  customer: [
    { to: '/', label: 'Home' },
    { to: '/cart', label: 'Cart' },
    { to: '/orders', label: 'Orders' },
  ],
  owner: [
    { to: '/owner', label: 'Dashboard' },
    { to: '/owner/menu', label: 'Menu' },
    { to: '/owner/orders', label: 'Orders' },
  ],
  rider: [
    { to: '/rider', label: 'Deliveries' },
  ],
  admin: [
    { to: '/admin', label: 'Panel' },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const links = user ? roleLinks[user.role] || roleLinks.customer : []

  return (
    <nav className="bg-orange-500 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
      <Link to={user ? '/' : '/login'} className="text-xl font-bold">Smart Serve</Link>

      {user && (
        <div className="flex gap-3 sm:gap-4 items-center text-sm sm:text-base">
          {links.map(l => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
          <span className="hidden sm:inline text-orange-200">|</span>
          <span className="hidden sm:inline text-orange-100 text-sm">{user.name}</span>
          <button onClick={logout} className="bg-white text-orange-500 px-3 py-1 rounded text-sm font-medium">
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
