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
    const { data: offer, error } = await supabase
      .from('tattoo_offers')
      .select(`
        *,
        request:request_id(
          id, title, description, style, size, placement,
          client:client_id(id, full_name, avatar_url, email)
        ),
        artist:artist_id(id, full_name, avatar_url, specialties, bio),
        studio:studio_id(id, name, avatar_url, services, description)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching offer:', error)
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Check if user has access to this offer
    const hasAccess = 
      offer.artist_id === user.id ||
      offer.studio_id === user.id ||
      offer.request?.client?.id === user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ offer })
  } catch (error) {
    console.error('Error in offer GET:', error)
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

    // First, get the offer with request details
    const { data: existingOffer, error: fetchError } = await supabase
      .from('tattoo_offers')
      .select(`
        *,
        request:request_id(
          id, client_id, status
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Check permissions based on the update type
    let hasPermission = false
    
    if (status) {
      if (status === 'accepted' || status === 'rejected') {
        // Only the client who made the request can accept/reject offers
        hasPermission = existingOffer.request?.client_id === user.id
      } else if (status === 'withdrawn') {
        // Only the artist/studio who made the offer can withdraw it
        hasPermission = 
          existingOffer.artist_id === user.id ||
          existingOffer.studio_id === user.id
      }
    } else {
      // Other updates can only be done by the artist/studio who made the offer
      hasPermission = 
        existingOffer.artist_id === user.id ||
        existingOffer.studio_id === user.id
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate status transitions
    if (status) {
      const currentStatus = existingOffer.status
      const validTransitions: Record<string, string[]> = {
        'pending': ['accepted', 'rejected', 'withdrawn'],
        'accepted': ['completed', 'cancelled'],
        'rejected': [],
        'withdrawn': [],
        'completed': [],
        'cancelled': []
      }

      if (!validTransitions[currentStatus]?.includes(status)) {
        return NextResponse.json(
          { error: `Cannot change status from ${currentStatus} to ${status}` },
          { status: 400 }
        )
      }

      // If accepting an offer, reject all other offers for the same request
      if (status === 'accepted') {
        await supabase
          .from('tattoo_offers')
          .update({ status: 'rejected' })
          .eq('request_id', existingOffer.request_id)
          .neq('id', id)
          .eq('status', 'pending')

        // Also update the request status to 'in_progress'
        await supabase
          .from('tattoo_requests')
          .update({ status: 'in_progress' })
          .eq('id', existingOffer.request_id)
      }

      // If completing an offer, update the request status to 'completed'
      if (status === 'completed') {
        await supabase
          .from('tattoo_requests')
          .update({ status: 'completed' })
          .eq('id', existingOffer.request_id)
      }
    }

    // Prepare update data
    const allowedFields = [
      'message', 'price', 'estimated_duration', 'available_dates',
      'portfolio_images', 'terms_conditions', 'status'
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

    // Convert price to number if provided
    if (filteredUpdateData.price) {
      filteredUpdateData.price = parseFloat(filteredUpdateData.price)
    }

    const { data: updatedOffer, error } = await supabase
      .from('tattoo_offers')
      .update(filteredUpdateData)
      .eq('id', id)
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
      console.error('Error updating offer:', error)
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
    }

    return NextResponse.json({ offer: updatedOffer })
  } catch (error) {
    console.error('Error in offer PUT:', error)
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
    // Check if the offer exists and user is the one who made it
    const { data: existingOffer, error: fetchError } = await supabase
      .from('tattoo_offers')
      .select('artist_id, studio_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const hasPermission = 
      existingOffer.artist_id === user.id ||
      existingOffer.studio_id === user.id

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Can only delete pending offers
    if (existingOffer.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending offers' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('tattoo_offers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting offer:', error)
      return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Offer deleted successfully' })
  } catch (error) {
    console.error('Error in offer DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}