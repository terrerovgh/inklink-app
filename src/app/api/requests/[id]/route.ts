import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data: request, error } = await supabase
      .from('tattoo_requests')
      .select(`
        *,
        client:client_id(id, full_name, avatar_url, email),
        artist:artist_id(id, full_name, avatar_url, specialties),
        studio:studio_id(id, name, avatar_url, services),
        offers:tattoo_offers(
          *,
          artist:artist_id(id, full_name, avatar_url, specialties),
          studio:studio_id(id, name, avatar_url, services)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching request:', error)
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check if user has access to this request
    const hasAccess = 
      request.client_id === user.id ||
      request.artist_id === user.id ||
      request.studio_id === user.id ||
      request.offers?.some((offer: any) => 
        offer.artist_id === user.id || offer.studio_id === user.id
      )

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ request })
  } catch (error) {
    console.error('Error in request GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, ...updateData } = body

    // First, check if the request exists and user has permission
    const { data: existingRequest, error: fetchError } = await supabase
      .from('tattoo_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check permissions based on the update type
    let hasPermission = false
    
    if (status) {
      // Status updates can be done by client (cancel), artist/studio (accept/reject)
      hasPermission = 
        existingRequest.client_id === user.id ||
        existingRequest.artist_id === user.id ||
        existingRequest.studio_id === user.id
    } else {
      // Other updates can only be done by the client who created the request
      hasPermission = existingRequest.client_id === user.id
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const allowedFields = [
      'title', 'description', 'style', 'size', 'placement',
      'budget_min', 'budget_max', 'preferred_date', 'reference_images', 'status'
    ]
    
    const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key]
        return obj
      }, {} as any)

    if (status) {
      filteredUpdateData.status = status
    }

    const { data: updatedRequest, error } = await supabase
      .from('tattoo_requests')
      .update(filteredUpdateData)
      .eq('id', id)
      .select(`
        *,
        client:client_id(id, full_name, avatar_url),
        artist:artist_id(id, full_name, avatar_url),
        studio:studio_id(id, name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error updating request:', error)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Error in request PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if the request exists and user is the client who created it
    const { data: existingRequest, error: fetchError } = await supabase
      .from('tattoo_requests')
      .select('client_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existingRequest.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('tattoo_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting request:', error)
      return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error) {
    console.error('Error in request DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}