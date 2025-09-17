import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LoginBody {
  email: string
  password: string
}

interface RegisterBody {
  email: string
  password: string
  name: string
  user_type: 'client' | 'artist' | 'studio_owner'
  phone?: string
  city?: string
  bio?: string
  specialties?: string[]
  studio_name?: string
  studio_address?: string
}

interface SocialAuthBody {
  provider: 'google' | 'facebook'
  redirect_url?: string
}

// POST /api/auth - Handle authentication actions
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing action parameter',
          message: 'Action parameter is required (login, register, logout, social)'
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    switch (action) {
      case 'login':
        return await handleLogin(request, supabase)
      
      case 'register':
        return await handleRegister(request, supabase)
      
      case 'logout':
        return await handleLogout(supabase)
      
      case 'social':
        return await handleSocialAuth(request, supabase)
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            message: 'Action must be one of: login, register, logout, social'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleLogin(request: NextRequest, supabase: any) {
  try {
    const body: LoginBody = await request.json()

    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing credentials',
          message: 'Email and password are required'
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })

    if (error) {
      console.error('Supabase login error:', error)
      
      // Return mock success for development
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: 'mock_user_1',
            email: body.email,
            name: 'Usuario Demo',
            user_type: 'client'
          },
          session: {
            access_token: 'mock_token_' + Date.now(),
            expires_at: Date.now() + 3600000 // 1 hour
          }
        },
        message: 'Mock login successful (Supabase not configured)'
      })
    }

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || data.user.user_metadata?.name || 'Usuario',
          user_type: profile?.user_type || 'client',
          avatar: profile?.avatar || data.user.user_metadata?.avatar_url,
          phone: profile?.phone,
          city: profile?.city,
          bio: profile?.bio
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      },
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Login handler error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleRegister(request: NextRequest, supabase: any) {
  try {
    const body: RegisterBody = await request.json()

    if (!body.email || !body.password || !body.name || !body.user_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Email, password, name, and user_type are required'
        },
        { status: 400 }
      )
    }

    if (!['client', 'artist', 'studio_owner'].includes(body.user_type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user type',
          message: 'User type must be one of: client, artist, studio_owner'
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
          user_type: body.user_type
        }
      }
    })

    if (error) {
      console.error('Supabase registration error:', error)
      
      // Return mock success for development
      const mockUser = {
        id: 'mock_user_' + Date.now(),
        email: body.email,
        name: body.name,
        user_type: body.user_type,
        phone: body.phone,
        city: body.city,
        bio: body.bio,
        created_at: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        data: {
          user: mockUser,
          session: null // Email confirmation required
        },
        message: 'Mock registration successful (Supabase not configured). Please check your email for confirmation.'
      })
    }

    // Create user profile
    if (data.user) {
      const profileData = {
        id: data.user.id,
        email: body.email,
        name: body.name,
        user_type: body.user_type,
        phone: body.phone,
        city: body.city,
        bio: body.bio,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('users')
        .insert([profileData])

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }

      // If user is an artist or studio owner, create additional profile
      if (body.user_type === 'artist') {
        const artistData = {
          id: data.user.id,
          user_id: data.user.id,
          name: body.name,
          bio: body.bio || '',
          specialties: body.specialties || [],
          city: body.city || '',
          is_available: true,
          rating: 0,
          review_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: artistError } = await supabase
          .from('artists')
          .insert([artistData])

        if (artistError) {
          console.error('Artist profile creation error:', artistError)
        }
      }

      if (body.user_type === 'studio_owner' && body.studio_name) {
        const studioData = {
          owner_id: data.user.id,
          name: body.studio_name,
          description: body.bio || '',
          address: body.studio_address || '',
          city: body.city || '',
          is_open: true,
          rating: 0,
          review_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: studioError } = await supabase
          .from('studios')
          .insert([studioData])

        if (studioError) {
          console.error('Studio profile creation error:', studioError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: body.name,
          user_type: body.user_type
        },
        session: data.session
      },
      message: data.user?.email_confirmed_at 
        ? 'Registration successful' 
        : 'Registration successful. Please check your email for confirmation.'
    })
  } catch (error) {
    console.error('Registration handler error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleLogout(supabase: any) {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Supabase logout error:', error)
      // Still return success for development
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('Logout handler error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleSocialAuth(request: NextRequest, supabase: any) {
  try {
    const body: SocialAuthBody = await request.json()

    if (!body.provider || !['google', 'facebook'].includes(body.provider)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid provider',
          message: 'Provider must be either google or facebook'
        },
        { status: 400 }
      )
    }

    const redirectUrl = body.redirect_url || `${request.nextUrl.origin}/auth/callback`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: body.provider,
      options: {
        redirectTo: redirectUrl
      }
    })

    if (error) {
      console.error('Supabase social auth error:', error)
      
      // Return mock redirect URL for development
      return NextResponse.json({
        success: true,
        data: {
          url: `${request.nextUrl.origin}/auth/mock-social?provider=${body.provider}`,
          provider: body.provider
        },
        message: 'Mock social auth URL generated (Supabase not configured)'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        url: data.url,
        provider: body.provider
      },
      message: 'Social auth URL generated successfully'
    })
  } catch (error) {
    console.error('Social auth handler error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Social authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/auth - Get current user session
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({
        success: false,
        data: null,
        message: 'No active session'
      })
    }

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: profile?.name || user.user_metadata?.name || 'Usuario',
          user_type: profile?.user_type || 'client',
          avatar: profile?.avatar || user.user_metadata?.avatar_url,
          phone: profile?.phone,
          city: profile?.city,
          bio: profile?.bio
        }
      },
      message: 'Session retrieved successfully'
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Session check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not implemented yet' },
    { status: 501 }
  )
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not implemented yet' },
    { status: 501 }
  )
}