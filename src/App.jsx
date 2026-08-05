import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { NotificationProvider } from './context/NotificationContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Home from './pages/Home'
import Restaurant from './pages/Restaurant'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import OwnerDashboard from './pages/owner/Dashboard'
import OwnerMenu from './pages/owner/MenuManagement'
import OwnerOrders from './pages/owner/Orders'
import AdminPanel from './pages/admin/Panel'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-56px)] bg-gray-50">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/restaurant/:id" element={<ProtectedRoute><Restaurant /></ProtectedRoute>} />
              <Route path="/cart" element={<RoleRoute roles={['customer']}><Cart /></RoleRoute>} />
              <Route path="/checkout" element={<RoleRoute roles={['customer']}><Checkout /></RoleRoute>} />
              <Route path="/orders" element={<RoleRoute roles={['customer']}><OrderTracking /></RoleRoute>} />
              <Route path="/owner" element={<RoleRoute roles={['owner', 'rider']}><OwnerDashboard /></RoleRoute>} />
              <Route path="/owner/menu" element={<RoleRoute roles={['owner', 'rider']}><OwnerMenu /></RoleRoute>} />
              <Route path="/owner/orders" element={<RoleRoute roles={['owner', 'rider']}><OwnerOrders /></RoleRoute>} />
              <Route path="/rider" element={<RoleRoute roles={['owner', 'rider']}><OwnerDashboard /></RoleRoute>} />
              <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminPanel /></RoleRoute>} />
            </Routes>
            </main>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
