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

  it('renders polyline when both restaurant and delivery exist', () => {
    render(
      <MapView
        restaurant={{ latitude: 12.97, longitude: 77.59 }}
        delivery={{ latitude: 12.98, longitude: 77.60 }}
      />
    )
    expect(screen.getByTestId('polyline')).toBeInTheDocument()
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

  it('restaurant coordinates are within Bengaluru area', () => {
    MOCK_RESTAURANTS.forEach(r => {
      expect(r.latitude).toBeGreaterThan(12.9)
      expect(r.latitude).toBeLessThan(13.0)
      expect(r.longitude).toBeGreaterThan(77.5)
      expect(r.longitude).toBeLessThan(77.7)
    })
  })
})
