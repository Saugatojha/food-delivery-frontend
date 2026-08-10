import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OrderTracking from '../pages/OrderTracking'
import { getAllOrders } from '../services/orders'
import MapView from '../components/MapView'

vi.mock('../services/orders', () => ({
  getAllOrders: vi.fn(),
  STATUS_FLOWS: {
    customer: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'],
  },
}))

vi.mock('../components/MapView', () => ({
  default: vi.fn(({ rider }) => <div data-testid="map" data-has-rider={rider ? 'yes' : 'no'} />),
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

describe('OrderTracking rider location', () => {
  const orderWithDelivery = (delivery) => ({
    id: 1,
    status: 'Out for Delivery',
    items: [],
    total: 100,
    address: 'Test St',
    deliveryLatitude: 27.7,
    deliveryLongitude: 85.3,
    restaurant: { latitude: 27.715, longitude: 85.312 },
    delivery,
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render a rider marker when the delivery has no rider coords', async () => {
    getAllOrders.mockResolvedValue([orderWithDelivery({ status: 'assigned' })])
    await act(async () => { renderTracking() })
    expect(MapView).toHaveBeenCalled()
    expect(screen.getByTestId('map')).toHaveAttribute('data-has-rider', 'no')
  })

  it('renders a rider marker using the real delivery rider coords', async () => {
    getAllOrders.mockResolvedValue([
      orderWithDelivery({ status: 'assigned', riderLatitude: 27.71, riderLongitude: 85.306 }),
    ])
    await act(async () => { renderTracking() })
    expect(screen.getByTestId('map')).toHaveAttribute('data-has-rider', 'yes')
    const riderProp = MapView.mock.calls.at(-1)[0].rider
    expect(riderProp).toEqual({ latitude: 27.71, longitude: 85.306 })
  })
})
