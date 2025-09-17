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
    const status = searchParams.get('status')
    const type = searchParams.get('type') // 'sent' or 'received'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('tattoo_requests')
      .select(`
        *,
        client:client_id(id, full_name, avatar_url),
        artist:artist_id(id, full_name, avatar_url),
        studio:studio_id(id, name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type === 'sent') {
      query = query.eq('client_id', user.id)
    } else if (type === 'received') {
      query = query.or(`artist_id.eq.${user.id},studio_id.eq.${user.id}`)
    } else {
      // All requests for the user
      query = query.or(`client_id.eq.${user.id},artist_id.eq.${user.id},studio_id.eq.${user.id}`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching requests:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error in requests GET:', error)
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
      title,
      description,
      style,
      size,
      placement,
      budget_min,
      budget_max,
      preferred_date,
      reference_images,
      artist_id,
      studio_id
    } = body

    // Validate required fields
    if (!title || !description || !style || !size || !placement) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const requestData = {
      client_id: user.id,
      title,
      description,
      style,
      size,
      placement,
      budget_min: budget_min || null,
      budget_max: budget_max || null,
      preferred_date: preferred_date || null,
      reference_images: reference_images || [],
      artist_id: artist_id || null,
      studio_id: studio_id || null,
      status: 'pending'
    }

    const { data: newRequest, error } = await supabase
      .from('tattoo_requests')
      .insert([requestData])
      .select(`
        *,
        client:client_id(id, full_name, avatar_url),
        artist:artist_id(id, full_name, avatar_url),
        studio:studio_id(id, name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating request:', error)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Error in requests POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}