import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { getCart } from '../services/orders'

const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-white/70 rounded'

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
    { to: '/owner', label: 'Dashboard' },
    { to: '/owner/menu', label: 'Menu' },
    { to: '/owner/orders', label: 'Orders' },
  ],
  admin: [
    { to: '/admin', label: 'Panel' },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { unreadCount, notifications, open, toggle, markAllRead, markRead } = useNotifications()
  const [cartQty, setCartQty] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const bellRef = useRef(null)
  const links = user ? roleLinks[user.role] || roleLinks.customer : []

  useEffect(() => {
    const update = () => setCartQty(getCart().reduce((s, i) => s + i.qty, 0))
    update()
    window.addEventListener('cart-update', update)
    return () => window.removeEventListener('cart-update', update)
  }, [])

  useEffect(() => {
    const onDocClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <nav className="bg-orange-500 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
      <Link to={user ? '/' : '/login'} className={`text-xl font-bold flex items-center gap-3 ${FOCUS_RING}`} aria-label="Home">
          <img src="/logo.png" alt="Smart Serve" className="h-8 w-auto" />
          <span className="sr-only">Smart Serve</span>
        </Link>

      {user && (
        <>
          <button
            className={`sm:hidden text-white text-2xl leading-none ${FOCUS_RING}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? 'âœ•' : 'â˜°'}
          </button>

          <div className={`${menuOpen ? 'flex' : 'hidden'} sm:flex absolute sm:static top-14 left-0 right-0 bg-orange-500 sm:bg-transparent flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center text-sm sm:text-base p-4 sm:p-0 z-50 shadow-lg sm:shadow-none`}>
            {links.map(l => (
              <Link key={l.to} to={l.to} className={`relative ${FOCUS_RING}`} onClick={() => setMenuOpen(false)}>
                {l.label}
                {l.label === 'Cart' && cartQty > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartQty}
                  </span>
                )}
              </Link>
            ))}
            <span className="hidden sm:inline text-orange-200">|</span>
            <div className="relative" ref={bellRef}>
              <button
                onClick={toggle}
                className={`relative text-white p-1.5 rounded-full hover:bg-orange-600 ${FOCUS_RING}`}
                aria-label={open ? 'Close notifications' : 'Open notifications'}
                aria-expanded={open}
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 px-0.5 flex items-center justify-center rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-lg shadow-xl border z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-orange-600 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No notifications yet</p>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`block w-full text-left px-3 py-2 border-b text-sm hover:bg-gray-50 ${n.read ? '' : 'bg-orange-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{n.title}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-orange-500" aria-label="unread" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="text-orange-100 text-sm">{user.name}</span>
            <button onClick={logout} className={`bg-white text-orange-700 px-3 py-1.5 rounded text-sm font-medium ${FOCUS_RING}`} aria-label="Logout">
              Logout
            </button>
          </div>
        </>
      )}
    </nav>
  )
}
