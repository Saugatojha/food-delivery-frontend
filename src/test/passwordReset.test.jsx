import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: vi.fn(() => ({ showToast: vi.fn() })),
}))

import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'

describe('ForgotPassword', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ forgotPassword: vi.fn() })
    useToast.mockReturnValue({ showToast: vi.fn() })
  })

  it('renders the form', () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>)
    expect(screen.getByText('Forgot Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Email or Username')).toBeInTheDocument()
  })

  it('requires an email', () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(screen.getByText('Email or username is required')).toBeInTheDocument()
    expect(useAuth().forgotPassword).not.toHaveBeenCalled()
  })

  it('submits and shows the success message with dev link', async () => {
    const forgotPassword = vi.fn().mockResolvedValue({ devLink: 'http://localhost:5173/reset-password?token=abc' })
    useAuth.mockReturnValue({ forgotPassword })
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Email or Username'), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    await screen.findByText('If an account exists for that email, a password reset link has been sent. Check your inbox.')
    expect(forgotPassword).toHaveBeenCalledWith('a@b.com')
    expect(screen.getByRole('link', { name: /reset-password\?token=abc/ })).toBeInTheDocument()
  })
})

describe('ResetPassword', () => {
  const resetPassword = vi.fn().mockResolvedValue({ message: 'ok' })

  beforeEach(() => {
    resetPassword.mockClear()
    useAuth.mockReturnValue({ resetPassword })
    useToast.mockReturnValue({ showToast: vi.fn() })
  })

  it('shows an invalid-link message when no token is present', () => {
    render(<MemoryRouter initialEntries={['/reset-password']}><ResetPassword /></MemoryRouter>)
    expect(screen.getByText(/invalid or missing/i)).toBeInTheDocument()
  })

  it('validates password strength and match', () => {
    render(<MemoryRouter initialEntries={['/reset-password?token=abc&email=a@b.com']}><ResetPassword /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'weak' } })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'weak' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    expect(screen.getByText('Password does not meet all requirements')).toBeInTheDocument()
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('submits the token and new password, then confirms via toast', async () => {
    const showToast = vi.fn()
    useToast.mockReturnValue({ showToast })
    render(<MemoryRouter initialEntries={['/reset-password?token=abc&email=a@b.com']}><ResetPassword /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'StrongPass1!' } })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'StrongPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith('abc', 'StrongPass1!'))
    expect(showToast).toHaveBeenCalledWith('Password reset successful! Please log in.', 'success')
  })
})
