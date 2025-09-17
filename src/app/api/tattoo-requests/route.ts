import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('client_id')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius')
    const minBudget = searchParams.get('min_budget')
    const maxBudget = searchParams.get('max_budget')
    const style = searchParams.get('style')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('tattoo_requests')
      .select(`
        id,
        client_id,
        title,
        description,
        style,
        size,
        placement,
        budget_min,
        budget_max,
        reference_images,
        location,
        status,
        deadline,
        created_at,
        updated_at,
        profiles!tattoo_requests_client_id_fkey (
          id,
          full_name,
          avatar_url,
          rating,
          review_count
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by client
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    // Filter by style
    if (style && style !== 'all') {
      query = query.eq('style', style)
    }

    // Filter by budget range
    if (minBudget) {
      query = query.gte('budget_max', parseInt(minBudget))
    }
    if (maxBudget) {
      query = query.lte('budget_min', parseInt(maxBudget))
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching tattoo requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tattoo requests' },
        { status: 500 }
      )
    }

    // Calculate distances if location provided
    let processedRequests = requests || []
    if (lat && lng) {
      const userLat = parseFloat(lat)
      const userLng = parseFloat(lng)
      const maxRadius = radius ? parseFloat(radius) : null

      processedRequests = requests
        ?.map(request => {
          if (!request.location?.lat || !request.location?.lng) {
            return { ...request, distance: null }
          }

          // Haversine formula for distance calculation
          const R = 6371 // Earth's radius in kilometers
          const dLat = (request.location.lat - userLat) * Math.PI / 180
          const dLng = (request.location.lng - userLng) * Math.PI / 180
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(request.location.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          const distance = R * c

          return {
            ...request,
            distance: Math.round(distance * 100) / 100
          }
        })
        .filter(request => {
          if (maxRadius && request.distance !== null) {
            return request.distance <= maxRadius
          }
          return true
        })
        .sort((a, b) => {
          if (a.distance !== null && b.distance !== null) {
            return a.distance - b.distance
          }
          return 0
        }) || []
    }

    return NextResponse.json({
      requests: processedRequests,
      total: processedRequests.length,
      offset,
      limit
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile to ensure they're a client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please create a profile first.' },
        { status: 404 }
      )
    }

    if (profile.user_type !== 'client') {
      return NextResponse.json(
        { error: 'Only clients can create tattoo requests' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      style,
      size,
      placement,
      budget_min,
      budget_max,
      reference_images,
      location,
      deadline
    } = body

    // Validate required fields
    if (!title || !description || !style || !size || !placement || !budget_min || !budget_max || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate budget range
    if (budget_min > budget_max) {
      return NextResponse.json(
        { error: 'Minimum budget cannot be greater than maximum budget' },
        { status: 400 }
      )
    }

    // Create new tattoo request
    const { data: tattooRequest, error } = await supabase
      .from('tattoo_requests')
      .insert({
        client_id: profile.id,
        title,
        description,
        style,
        size,
        placement,
        budget_min,
        budget_max,
        reference_images: reference_images || [],
        location,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status: 'open',
        is_active: true
      })
      .select(`
        *,
        profiles!tattoo_requests_client_id_fkey (
          id,
          full_name,
          avatar_url,
          rating,
          review_count
        )
      `)
      .single()

    if (error) {
      console.error('Error creating tattoo request:', error)
      return NextResponse.json(
        { error: 'Failed to create tattoo request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ request: tattooRequest }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}