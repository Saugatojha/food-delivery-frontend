import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../context/ToastContext'

function ToastHarness() {
  const { showToast } = useToast()
  return (
    <div>
      <button onClick={() => showToast('Toast A', 'info')}>A</button>
      <button onClick={() => showToast('Toast B', 'success')}>B</button>
      <button onClick={() => showToast('Toast C', 'error')}>C</button>
      <button onClick={() => showToast('Toast D', 'info')}>D</button>
    </div>
  )
}

function renderHarness() {
  return render(<ToastProvider><ToastHarness /></ToastProvider>)
}

describe('ToastContext', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a toast with alert role and assertive live region', () => {
    renderHarness()
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    const toast = screen.getByText('Toast A').closest('[role="alert"]')
    expect(toast).toBeInTheDocument()
    expect(toast).toHaveAttribute('aria-live', 'assertive')
  })

  it('dismisses a toast via its close button', () => {
    renderHarness()
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(screen.getByText('Toast A')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(screen.queryByText('Toast A')).not.toBeInTheDocument()
  })

  it('caps visible toasts at 3, dropping the oldest', () => {
    renderHarness()
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    fireEvent.click(screen.getByRole('button', { name: 'C' }))
    fireEvent.click(screen.getByRole('button', { name: 'D' }))
    expect(screen.queryByText('Toast A')).not.toBeInTheDocument()
    expect(screen.getByText('Toast B')).toBeInTheDocument()
    expect(screen.getByText('Toast C')).toBeInTheDocument()
    expect(screen.getByText('Toast D')).toBeInTheDocument()
  })

  it('auto-dismisses toasts after 3 seconds', async () => {
    vi.useFakeTimers()
    renderHarness()
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(screen.getByText('Toast A')).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(screen.queryByText('Toast A')).not.toBeInTheDocument()
  })
})
