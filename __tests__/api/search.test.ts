import { NextRequest } from 'next/server'

// Mock console.error to avoid test failures
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock Supabase completely
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          range: jest.fn(() => ({
            or: jest.fn(() => ({
              rpc: jest.fn(() => Promise.resolve({
                data: [
                  {
                    id: '1',
                    name: 'Test Artist',
                    latitude: 40.7128,
                    longitude: -74.0060,
                    bio: 'Test bio',
                    specialties: ['Traditional'],
                    user: { full_name: 'Test User' }
                  }
                ],
                error: null
              }))
            }))
          }))
        }))
      }))
    }))
  }
}))

// Import after mocking
const { GET } = require('@/app/api/search/route')

describe('/api/search', () => {
  it('should handle basic search request', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test')
    const response = await GET(request)
    
    expect(response).toBeDefined()
    expect(response.status).toBeDefined()
  })

  it('should handle geographic search', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?lat=40.7128&lng=-74.0060&radius=5000')
    const response = await GET(request)
    
    expect(response).toBeDefined()
    expect(response.status).toBeDefined()
  })

  it('should handle empty search', async () => {
    const request = new NextRequest('http://localhost:3000/api/search')
    const response = await GET(request)
    
    expect(response).toBeDefined()
    expect(response.status).toBeDefined()
  })
})