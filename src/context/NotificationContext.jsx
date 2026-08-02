import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

const POLL_MS = 15000

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const lastCountRef = useRef(0)
  const permissionAskedRef = useRef(false)

  const fetchUnread = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count)
      if (data.count > lastCountRef.current) {
        const { data: list } = await api.get('/notifications')
        const newest = list[0]
        if (newest) {
          try {
            if (!('Notification' in window)) return
            if (Notification.permission === 'default' && !permissionAskedRef.current) {
              permissionAskedRef.current = true
              Notification.requestPermission()
            }
            if (Notification.permission === 'granted') {
              new Notification(newest.title, { body: newest.message, tag: `order-${newest.id}` })
            }
          } catch {}
        }
      }
      lastCountRef.current = data.count
    } catch {}
  }, [user])

  useEffect(() => {
    if (!user) {
      const id = setTimeout(() => {
        setUnreadCount(0)
        setNotifications([])
        lastCountRef.current = 0
      }, 0)
      return () => clearTimeout(id)
    }
    fetchUnread()
    const id = setInterval(fetchUnread, POLL_MS)
    return () => clearInterval(id)
  }, [user, fetchUnread])

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
      lastCountRef.current = data.filter(n => !n.read).length
    } catch {}
  }, [user])

  const markAllRead = useCallback(async () => {
    setUnreadCount(0)
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    try { await api.post('/notifications/read-all') } catch {}
  }, [])

  const markRead = useCallback(async (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
    try { await api.patch(`/notifications/${id}/read`) } catch {}
  }, [])

  const toggle = useCallback(() => {
    setOpen(o => {
      const next = !o
      if (next) refresh()
      return next
    })
  }, [refresh])

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, open, toggle, refresh, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationContext)
