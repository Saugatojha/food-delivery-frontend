import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MOCK_RESTAURANTS } from '../data/mock'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }) => <div data-testid="marker" data-lat={position?.[0]} data-lng={position?.[1]} />,
  Polyline: ({ positions }) => <div data-testid="polyline" data-count={positions?.length} />,
  useMapEvents: () => null,
  useMap: () => ({ fitBounds: vi.fn() }),
}))

import MapView from '../components/MapView'

describe('MapView', () => {
  it('renders map container', () => {
    render(<MapView />)
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('renders restaurant marker', () => {
    render(<MapView restaurant={{ latitude: 12.97, longitude: 77.59 }} />)
    const markers = screen.getAllByTestId('marker')
    expect(markers.length).toBeGreaterThanOrEqual(1)
  })

  it('renders delivery marker', () => {
    render(<MapView delivery={{ latitude: 12.98, longitude: 77.60 }} />)
    const markers = screen.getAllByTestId('marker')
    expect(markers.length).toBeGreaterThanOrEqual(1)
  })

  it('renders both markers when both provided', () => {
    render(
      <MapView
        restaurant={{ latitude: 12.97, longitude: 77.59 }}
        delivery={{ latitude: 12.98, longitude: 77.60 }}
      />
    )
    expect(screen.getAllByTestId('marker')).toHaveLength(2)
  })

  it('renders polyline when both restaurant and delivery exist', async () => {
    const mockRoute = { routes: [{ geometry: { coordinates: [[77.59, 12.97], [77.60, 12.98]] } }] }
    globalThis.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(mockRoute) })
    render(
      <MapView
        restaurant={{ latitude: 12.97, longitude: 77.59 }}
        delivery={{ latitude: 12.98, longitude: 77.60 }}
      />
    )
    const polyline = await screen.findByTestId('polyline', {}, { timeout: 2000 })
    expect(polyline).toBeInTheDocument()
  })

  it('shows the OSRM route note when a route loads', async () => {
    const mockRoute = { routes: [{ geometry: { coordinates: [[77.59, 12.97], [77.60, 12.98]] } }] }
    globalThis.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(mockRoute) })
    render(
      <MapView
        restaurant={{ latitude: 12.97, longitude: 77.59 }}
        delivery={{ latitude: 12.98, longitude: 77.60 }}
        showRouteNote
      />
    )
    expect(await screen.findByText('Route via OSRM (road network)', {}, { timeout: 2000 })).toBeInTheDocument()
  })

  it('shows a Route unavailable note when the OSRM fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'))
    render(
      <MapView
        restaurant={{ latitude: 12.97, longitude: 77.59 }}
        delivery={{ latitude: 12.98, longitude: 77.60 }}
        showRouteNote
      />
    )
    expect(await screen.findByText('Route unavailable', {}, { timeout: 2000 })).toBeInTheDocument()
  })
})

describe('restaurant coordinates', () => {
  it('all restaurants have coordinates', () => {
    MOCK_RESTAURANTS.forEach(r => {
      expect(r.latitude).toBeDefined()
      expect(r.longitude).toBeDefined()
      expect(typeof r.latitude).toBe('number')
      expect(typeof r.longitude).toBe('number')
    })
  })

  it('restaurant coordinates are within Kathmandu area', () => {
    MOCK_RESTAURANTS.forEach(r => {
      expect(r.latitude).toBeGreaterThan(27.6)
      expect(r.latitude).toBeLessThan(27.8)
      expect(r.longitude).toBeGreaterThan(85.2)
      expect(r.longitude).toBeLessThan(85.5)
    })
  })
})
