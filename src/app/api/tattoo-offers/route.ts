import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')
    const artistId = searchParams.get('artist_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('tattoo_offers')
      .select(`
        id,
        request_id,
        artist_id,
        message,
        proposed_price,
        estimated_duration,
        availability_start,
        availability_end,
        portfolio_samples,
        status,
        created_at,
        updated_at,
        tattoo_requests (
          id,
          title,
          description,
          style,
          size,
          placement,
          budget_min,
          budget_max,
          location
        ),
        profiles!tattoo_offers_artist_id_fkey (
          id,
          full_name,
          avatar_url,
          rating,
          review_count,
          specialties,
          contact
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by request ID
    if (requestId) {
      query = query.eq('request_id', requestId)
    }

    // Filter by artist ID
    if (artistId) {
      query = query.eq('artist_id', artistId)
    }

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: offers, error } = await query

    if (error) {
      console.error('Error fetching tattoo offers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tattoo offers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      offers: offers || [],
      total: offers?.length || 0,
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

    // Get user's profile to ensure they're an artist
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

    if (profile.user_type !== 'artist') {
      return NextResponse.json(
        { error: 'Only artists can create tattoo offers' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      request_id,
      message,
      proposed_price,
      estimated_duration,
      availability_start,
      availability_end,
      portfolio_samples
    } = body

    // Validate required fields
    if (!request_id || !message || !proposed_price || !estimated_duration) {
      return NextResponse.json(
        { error: 'Missing required fields: request_id, message, proposed_price, estimated_duration' },
        { status: 400 }
      )
    }

    // Check if tattoo request exists and is open
    const { data: tattooRequest, error: requestError } = await supabase
      .from('tattoo_requests')
      .select('id, status, client_id')
      .eq('id', request_id)
      .eq('is_active', true)
      .single()

    if (requestError || !tattooRequest) {
      return NextResponse.json(
        { error: 'Tattoo request not found' },
        { status: 404 }
      )
    }

    if (tattooRequest.status !== 'open') {
      return NextResponse.json(
        { error: 'This tattoo request is no longer accepting offers' },
        { status: 400 }
      )
    }

    // Check if artist already made an offer for this request
    const { data: existingOffer } = await supabase
      .from('tattoo_offers')
      .select('id')
      .eq('request_id', request_id)
      .eq('artist_id', profile.id)
      .eq('is_active', true)
      .single()

    if (existingOffer) {
      return NextResponse.json(
        { error: 'You have already made an offer for this tattoo request' },
        { status: 409 }
      )
    }

    // Create new tattoo offer
    const { data: tattooOffer, error } = await supabase
      .from('tattoo_offers')
      .insert({
        request_id,
        artist_id: profile.id,
        message,
        proposed_price,
        estimated_duration,
        availability_start: availability_start ? new Date(availability_start).toISOString() : null,
        availability_end: availability_end ? new Date(availability_end).toISOString() : null,
        portfolio_samples: portfolio_samples || [],
        status: 'pending',
        is_active: true
      })
      .select(`
        *,
        tattoo_requests (
          id,
          title,
          description,
          style,
          size,
          placement,
          budget_min,
          budget_max,
          location
        ),
        profiles!tattoo_offers_artist_id_fkey (
          id,
          full_name,
          avatar_url,
          rating,
          review_count,
          specialties,
          contact
        )
      `)
      .single()

    if (error) {
      console.error('Error creating tattoo offer:', error)
      return NextResponse.json(
        { error: 'Failed to create tattoo offer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ offer: tattooOffer }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}