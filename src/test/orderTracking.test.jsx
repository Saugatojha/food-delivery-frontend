import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrderTracking from '../pages/OrderTracking'
import { getAllOrders } from '../services/orders'

vi.mock('../services/orders', () => ({
  getAllOrders: vi.fn(),
  STATUS_FLOWS: {
    customer: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'],
  },
}))

vi.mock('../components/MapView', () => ({
  default: vi.fn(() => <div data-testid="map" />),
}))

vi.mock('../data/mock', () => ({
  formatPrice: n => `Rs ${n}`,
  MOCK_RESTAURANTS: [],
}))

vi.mock('../components/LoadingSkeleton', () => ({
  CardSkeleton: () => <div data-testid="skeleton" />,
}))

vi.mock('../components/EmptyState', () => ({
  default: ({ title }) => <div data-testid="empty">{title}</div>,
}))

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal()
  return { ...actual, Link: ({ children }) => <a href="#">{children}</a> }
})

function renderTracking() {
  render(<MemoryRouter><OrderTracking /></MemoryRouter>)
}

describe('OrderTracking polling', () => {
  let hiddenSpy

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    getAllOrders.mockResolvedValue([])
    hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  })

  afterEach(() => {
    hiddenSpy.mockRestore()
    vi.useRealTimers()
  })

  it('fetches orders immediately on mount', async () => {
    await act(async () => { renderTracking() })
    expect(getAllOrders).toHaveBeenCalledTimes(1)
  })

  it('refetches on the polling interval', async () => {
    await act(async () => { renderTracking() })
    expect(getAllOrders).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(getAllOrders).toHaveBeenCalledTimes(2)
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(getAllOrders).toHaveBeenCalledTimes(3)
  })

  it('does not poll while the tab is hidden', async () => {
    hiddenSpy.mockReturnValue(true)
    await act(async () => { renderTracking() })
    await act(async () => { await vi.advanceTimersByTimeAsync(60000) })
    expect(getAllOrders).toHaveBeenCalledTimes(1)
  })

  it('refetches immediately when the tab becomes visible again', async () => {
    hiddenSpy.mockReturnValue(true)
    await act(async () => { renderTracking() })
    await act(async () => { await vi.advanceTimersByTimeAsync(60000) })
    expect(getAllOrders).toHaveBeenCalledTimes(1)
    hiddenSpy.mockReturnValue(false)
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(getAllOrders).toHaveBeenCalledTimes(2)
  })

  it('refetches immediately on window focus', async () => {
    await act(async () => { renderTracking() })
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect(getAllOrders).toHaveBeenCalledTimes(2)
  })
})
