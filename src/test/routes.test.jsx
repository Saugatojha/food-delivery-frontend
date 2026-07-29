import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleRoute from '../components/RoleRoute'

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'

describe('ProtectedRoute', () => {
  it('renders children when user is logged in', () => {
    useAuth.mockReturnValue({ user: { name: 'John', role: 'customer' } })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>Protected content</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })

  it('redirects to login when user is not logged in', () => {
    useAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>Protected content</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})

describe('RoleRoute', () => {
  it('renders children when user has correct role', () => {
    useAuth.mockReturnValue({ user: { name: 'Owner', role: 'owner' } })
    render(
      <MemoryRouter initialEntries={['/owner']}>
        <Routes>
          <Route path="/owner" element={<RoleRoute roles={['owner']}><div>Owner panel</div></RoleRoute>} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Owner panel')).toBeInTheDocument()
  })

  it('redirects to home when user has wrong role', () => {
    useAuth.mockReturnValue({ user: { name: 'Customer', role: 'customer' } })
    render(
      <MemoryRouter initialEntries={['/owner']}>
        <Routes>
          <Route path="/owner" element={<RoleRoute roles={['owner']}><div>Owner panel</div></RoleRoute>} />
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Home page')).toBeInTheDocument()
    expect(screen.queryByText('Owner panel')).not.toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    useAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter initialEntries={['/owner']}>
        <Routes>
          <Route path="/owner" element={<RoleRoute roles={['owner']}><div>Owner panel</div></RoleRoute>} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})
