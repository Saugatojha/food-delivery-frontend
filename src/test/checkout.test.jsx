import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Checkout from '../pages/Checkout'
import * as ordersService from '../services/orders'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1, role: 'customer' } }) }))
vi.mock('../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }))
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }) => <div data-testid="marker" data-lat={position?.[0]} data-lng={position?.[1]} />,
  Polyline: () => <div data-testid="polyline" />,
  useMapEvents: () => null,
  useMap: () => ({ fitBounds: vi.fn() }),
}))

describe('Checkout map', () => {
  beforeEach(() => {
    localStorage.clear()
    ordersService.saveCart([{ id: 101, name: 'Pizza', price: 100, qty: 2, restaurantId: 1 }])
  })

  it('renders map on checkout', () => {
    render(<BrowserRouter><Checkout /></BrowserRouter>)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('redirects to cart when cart is empty', () => {
    localStorage.clear()
    render(<BrowserRouter><Checkout /></BrowserRouter>)
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument()
  })
})
