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
    const { data: tattooRequest, error } = await supabase
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
          review_count,
          contact
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tattoo request not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching tattoo request:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tattoo request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ request: tattooRequest })

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
    // Check if user owns this tattoo request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('tattoo_requests')
      .select('client_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Tattoo request not found' },
        { status: 404 }
      )
    }

    if (existingRequest.client_id !== profile.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own tattoo requests' },
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
      deadline,
      status
    } = body

    // Validate budget range if provided
    if (budget_min && budget_max && budget_min > budget_max) {
      return NextResponse.json(
        { error: 'Minimum budget cannot be greater than maximum budget' },
        { status: 400 }
      )
    }

    // Update tattoo request
    const { data: tattooRequest, error } = await supabase
      .from('tattoo_requests')
      .update({
        title,
        description,
        style,
        size,
        placement,
        budget_min,
        budget_max,
        reference_images,
        location,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      console.error('Error updating tattoo request:', error)
      return NextResponse.json(
        { error: 'Failed to update tattoo request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ request: tattooRequest })

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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const { id } = await params
    // Check if user owns this tattoo request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('tattoo_requests')
      .select('client_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Tattoo request not found' },
        { status: 404 }
      )
    }

    if (existingRequest.client_id !== profile.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own tattoo requests' },
        { status: 403 }
      )
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('tattoo_requests')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting tattoo request:', error)
      return NextResponse.json(
        { error: 'Failed to delete tattoo request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Tattoo request deleted successfully' })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}