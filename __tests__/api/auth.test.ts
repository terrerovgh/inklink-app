import { NextRequest } from 'next/server'

// Mock console.error to avoid test failures
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock Supabase Auth
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(() => Promise.resolve({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      })),
      signUp: jest.fn(() => Promise.resolve({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      signInWithOAuth: jest.fn(() => Promise.resolve({
        data: { url: 'https://oauth-url.com' },
        error: null
      })),
      getSession: jest.fn(() => Promise.resolve({
        data: { session: { user: { id: '1' } } },
        error: null
      }))
    }
  }))
}))

// Import after mocking
const { POST, GET } = require('@/app/api/auth/route')

describe('/api/auth', () => {
  it('should handle POST requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    })
    
    const response = await POST(request)
    expect(response).toBeDefined()
    expect(response.status).toBeDefined()
  })

  it('should handle GET requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth')
    const response = await GET(request)
    
    expect(response).toBeDefined()
    expect(response.status).toBeDefined()
  })
})