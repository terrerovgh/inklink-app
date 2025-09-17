import React from 'react'
import { render } from '@testing-library/react'

// Mock window object
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000'
  }
})

// Mock Leaflet completely
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: { _getIconUrl: jest.fn() },
      mergeOptions: jest.fn()
    }
  },
  map: jest.fn(() => ({
    setView: jest.fn().mockReturnThis(),
    on: jest.fn(),
    remove: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  }))
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }))
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Import after mocking
import MapComponent from '@/components/MapComponent'

describe('MapComponent', () => {
  it('should import without crashing', () => {
    expect(MapComponent).toBeDefined()
    expect(typeof MapComponent).toBe('function')
  })

  it('should be a React component', () => {
    expect(MapComponent.name).toBe('MapComponent')
  })

  it('should render without crashing', () => {
    const { container } = render(<MapComponent />)
    expect(container).toBeDefined()
  })
})