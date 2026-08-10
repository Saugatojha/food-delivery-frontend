import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let toastId = 0
const MAX_VISIBLE_TOASTS = 3

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => dismissToast(id), 3000)
  }, [dismissToast])

  const bg = { success: 'bg-green-700', error: 'bg-red-600', info: 'bg-orange-700' }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.slice(-MAX_VISIBLE_TOASTS).map(t => (
          <div key={t.id} role="alert" aria-live="assertive" className={`${bg[t.type] || bg.info} text-white px-4 py-2 rounded shadow-lg transition-all flex items-center gap-2`}>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss notification" className="text-white/80 hover:text-white text-lg leading-none shrink-0">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
