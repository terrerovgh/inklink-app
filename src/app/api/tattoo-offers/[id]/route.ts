import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { id } = await params
    const { data: tattooOffer, error } = await supabase
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
          location,
          profiles!tattoo_requests_client_id_fkey (
            id,
            full_name,
            avatar_url,
            contact
          )
        ),
        profiles!tattoo_offers_artist_id_fkey (
          id,
          full_name,
          avatar_url,
          rating,
          review_count,
          specialties,
          contact,
          portfolio_images
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tattoo offer not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching tattoo offer:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tattoo offer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ offer: tattooOffer })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const { id } = await params
    // Get the existing offer with related data
    const { data: existingOffer, error: fetchError } = await supabase
      .from('tattoo_offers')
      .select(`
        artist_id,
        tattoo_requests (
          client_id
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingOffer) {
      return NextResponse.json(
        { error: 'Tattoo offer not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status } = body

    // Check permissions based on user type and action
    if (profile.user_type === 'artist') {
      // Artists can only update their own offers (except status changes by client)
      if (existingOffer.artist_id !== profile.id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update your own offers' },
          { status: 403 }
        )
      }
      
      // Artists cannot change status to accepted/rejected (only client can)
      if (status && ['accepted', 'rejected'].includes(status)) {
        return NextResponse.json(
          { error: 'Only clients can accept or reject offers' },
          { status: 403 }
        )
      }
    } else if (profile.user_type === 'client') {
      // Clients can only change status of offers for their requests
      if (existingOffer.tattoo_requests?.client_id !== profile.id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only respond to offers for your requests' },
          { status: 403 }
        )
      }
      
      // Clients can only change status
      const allowedFields = ['status']
      const providedFields = Object.keys(body)
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field))
      
      if (invalidFields.length > 0) {
        return NextResponse.json(
          { error: `Clients can only update status. Invalid fields: ${invalidFields.join(', ')}` },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 403 }
      )
    }

    // Prepare update data based on user type
    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (profile.user_type === 'artist') {
      const {
        message,
        proposed_price,
        estimated_duration,
        availability_start,
        availability_end,
        portfolio_samples
      } = body

      updateData = {
        ...updateData,
        message,
        proposed_price,
        estimated_duration,
        availability_start: availability_start ? new Date(availability_start).toISOString() : undefined,
        availability_end: availability_end ? new Date(availability_end).toISOString() : undefined,
        portfolio_samples
      }
    } else {
      updateData.status = status
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Update tattoo offer
    const { data: tattooOffer, error } = await supabase
      .from('tattoo_offers')
      .update(updateData)
      .eq('id', id)
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
      console.error('Error updating tattoo offer:', error)
      return NextResponse.json(
        { error: 'Failed to update tattoo offer' },
        { status: 500 }
      )
    }

    // If offer was accepted, update the tattoo request status
    if (status === 'accepted') {
      await supabase
        .from('tattoo_requests')
        .update({ status: 'in_progress' })
        .eq('id', tattooOffer.request_id)
    }

    return NextResponse.json({ offer: tattooOffer })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const { id } = await params
    // Check if user owns this tattoo offer (only artists can delete their offers)
    const { data: existingOffer, error: fetchError } = await supabase
      .from('tattoo_offers')
      .select('artist_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingOffer) {
      return NextResponse.json(
        { error: 'Tattoo offer not found' },
        { status: 404 }
      )
    }

    if (profile.user_type !== 'artist' || existingOffer.artist_id !== profile.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only artists can delete their own offers' },
        { status: 403 }
      )
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('tattoo_offers')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting tattoo offer:', error)
      return NextResponse.json(
        { error: 'Failed to delete tattoo offer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Tattoo offer deleted successfully' })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}