import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Restaurant from './pages/Restaurant'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import OwnerDashboard from './pages/owner/Dashboard'
import OwnerMenu from './pages/owner/MenuManagement'
import OwnerOrders from './pages/owner/Orders'
import RiderDashboard from './pages/rider/Dashboard'
import AdminPanel from './pages/admin/Panel'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-56px)] bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/restaurant/:id" element={<ProtectedRoute><Restaurant /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/owner" element={<RoleRoute role="owner"><OwnerDashboard /></RoleRoute>} />
              <Route path="/owner/menu" element={<RoleRoute role="owner"><OwnerMenu /></RoleRoute>} />
              <Route path="/owner/orders" element={<RoleRoute role="owner"><OwnerOrders /></RoleRoute>} />
              <Route path="/rider" element={<RoleRoute role="rider"><RiderDashboard /></RoleRoute>} />
              <Route path="/admin" element={<RoleRoute role="admin"><AdminPanel /></RoleRoute>} />
            </Routes>
          </main>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
