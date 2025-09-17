import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')
    const status = searchParams.get('status')
    const type = searchParams.get('type') // 'sent' or 'received'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('tattoo_offers')
      .select(`
        *,
        request:request_id(
          id, title, description, style, size, placement,
          client:client_id(id, full_name, avatar_url)
        ),
        artist:artist_id(id, full_name, avatar_url, specialties),
        studio:studio_id(id, name, avatar_url, services)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (requestId) {
      query = query.eq('request_id', requestId)
    }

    if (type === 'sent') {
      query = query.or(`artist_id.eq.${user.id},studio_id.eq.${user.id}`)
    } else if (type === 'received') {
      // Get offers for requests created by this user
      const { data: userRequests } = await supabase
        .from('tattoo_requests')
        .select('id')
        .eq('client_id', user.id)
      
      if (userRequests && userRequests.length > 0) {
        const requestIds = userRequests.map(r => r.id)
        query = query.in('request_id', requestIds)
      } else {
        // No requests, so no received offers
        return NextResponse.json({ offers: [] })
      }
    } else {
      // All offers related to the user
      const { data: userRequests } = await supabase
        .from('tattoo_requests')
        .select('id')
        .eq('client_id', user.id)
      
      const requestIds = userRequests?.map(r => r.id) || []
      
      if (requestIds.length > 0) {
        query = query.or(
          `artist_id.eq.${user.id},studio_id.eq.${user.id},request_id.in.(${requestIds.join(',')})`
        )
      } else {
        query = query.or(`artist_id.eq.${user.id},studio_id.eq.${user.id}`)
      }
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: offers, error } = await query

    if (error) {
      console.error('Error fetching offers:', error)
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
    }

    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Error in offers GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      request_id,
      message,
      price,
      estimated_duration,
      available_dates,
      portfolio_images,
      terms_conditions
    } = body

    // Validate required fields
    if (!request_id || !message || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: request_id, message, price' },
        { status: 400 }
      )
    }

    // Check if the request exists and is still pending
    const { data: tattooRequest, error: requestError } = await supabase
      .from('tattoo_requests')
      .select('id, status, client_id, artist_id, studio_id')
      .eq('id', request_id)
      .single()

    if (requestError || !tattooRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (tattooRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot make offer on non-pending request' },
        { status: 400 }
      )
    }

    // Check if user is trying to make offer on their own request
    if (tattooRequest.client_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot make offer on your own request' },
        { status: 400 }
      )
    }

    // Check if this is a targeted request and user is not the target
    if (tattooRequest.artist_id && tattooRequest.artist_id !== user.id) {
      return NextResponse.json(
        { error: 'This request is targeted to a specific artist' },
        { status: 403 }
      )
    }

    if (tattooRequest.studio_id && tattooRequest.studio_id !== user.id) {
      return NextResponse.json(
        { error: 'This request is targeted to a specific studio' },
        { status: 403 }
      )
    }

    // Check if user already made an offer for this request
    const { data: existingOffer } = await supabase
      .from('tattoo_offers')
      .select('id')
      .eq('request_id', request_id)
      .or(`artist_id.eq.${user.id},studio_id.eq.${user.id}`)
      .single()

    if (existingOffer) {
      return NextResponse.json(
        { error: 'You have already made an offer for this request' },
        { status: 400 }
      )
    }

    // Get user profile to determine if they are artist or studio
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['artist', 'studio'].includes(profile.user_type)) {
      return NextResponse.json(
        { error: 'Only artists and studios can make offers' },
        { status: 403 }
      )
    }

    const offerData = {
      request_id,
      [profile.user_type === 'artist' ? 'artist_id' : 'studio_id']: user.id,
      message,
      price: parseFloat(price),
      estimated_duration: estimated_duration || null,
      available_dates: available_dates || [],
      portfolio_images: portfolio_images || [],
      terms_conditions: terms_conditions || null,
      status: 'pending'
    }

    const { data: newOffer, error } = await supabase
      .from('tattoo_offers')
      .insert([offerData])
      .select(`
        *,
        request:request_id(
          id, title, description,
          client:client_id(id, full_name, avatar_url)
        ),
        artist:artist_id(id, full_name, avatar_url, specialties),
        studio:studio_id(id, name, avatar_url, services)
      `)
      .single()

    if (error) {
      console.error('Error creating offer:', error)
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
    }

    return NextResponse.json({ offer: newOffer }, { status: 201 })
  } catch (error) {
    console.error('Error in offers POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}