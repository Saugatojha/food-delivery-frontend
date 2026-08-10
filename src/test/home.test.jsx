import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../pages/Home'
import api from '../api/client'

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }))

vi.mock('../api/client', () => ({
  default: { get: vi.fn() },
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast }),
}))

vi.mock('../components/LoadingSkeleton', () => ({
  ListSkeleton: () => <div data-testid="skeleton" />,
}))

vi.mock('../components/EmptyState', () => ({
  default: ({ title, message, action }) => (
    <div data-testid="empty">
      <div>{title}</div>
      {message && <div>{message}</div>}
      {action}
    </div>
  ),
}))

vi.mock('../components/MapView', () => ({
  default: () => <div data-testid="map" />,
}))

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal()
  return { ...actual, Link: ({ children, ...rest }) => <a href="#" {...rest}>{children}</a> }
})

describe('Home error handling', () => {
  beforeEach(() => {
    showToast.mockClear()
    api.get.mockClear()
  })

  it('renders restaurants on success', async () => {
    api.get.mockResolvedValueOnce({ data: {
      restaurants: [{ id: 1, name: 'Burger Barn', cuisine: 'American', rating: 4.2, isOpen: true, latitude: 27.7, longitude: 85.3, deliveryTime: '20 min', image: null }],
      total: 1,
      totalPages: 1,
    } })
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await screen.findByText('Burger Barn')).toBeInTheDocument()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('shows an inline error state with retry and a toast when the API fails', async () => {
    api.get.mockRejectedValueOnce(new Error('network'))
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await screen.findByText('Could not load restaurants')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry loading restaurants' })).toBeInTheDocument()
    expect(showToast).toHaveBeenCalledWith('Could not load restaurants. Please try again.', 'error')
  })

  it('retries the request when Retry is clicked', async () => {
    api.get.mockRejectedValueOnce(new Error('network'))
    api.get.mockResolvedValueOnce({ data: {
      restaurants: [{ id: 1, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.5, isOpen: true, latitude: 27.7, longitude: 85.3, deliveryTime: '30 min', image: null }],
      total: 1,
      totalPages: 1,
    } })
    render(<MemoryRouter><Home /></MemoryRouter>)
    const retry = await screen.findByRole('button', { name: 'Retry loading restaurants' })
    fireEvent.click(retry)
    expect(await screen.findByText('Pizza Palace')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(2)
  })
})
