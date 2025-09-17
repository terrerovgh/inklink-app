import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const offset = (page - 1) * limit

    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender_profile:profiles!notifications_sender_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (unreadOnly) {
      countQuery = countQuery.eq('read', false)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting notifications:', countError)
      return NextResponse.json({ error: 'Failed to count notifications' }, { status: 500 })
    }

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in notifications GET:', error)
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
    const { user_id, type, title, message, data, sender_id } = body

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, type, title, message' 
      }, { status: 400 })
    }

    // Validate notification type
    const validTypes = [
      'new_offer',
      'offer_accepted',
      'offer_rejected',
      'new_message',
      'new_review',
      'appointment_reminder',
      'payment_received',
      'system_notification'
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Create notification
    const notificationData = {
      user_id,
      type,
      title,
      message,
      data: data || {},
      sender_id: sender_id || user.id,
      read: false
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select(`
        *,
        sender_profile:profiles!notifications_sender_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error in notifications POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notification_ids } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing action field' }, { status: 400 })
    }

    let updateData: any = {}
    let query = supabase
      .from('notifications')
      .update(updateData)
      .eq('user_id', user.id)

    switch (action) {
      case 'mark_all_read':
        updateData.read = true
        query = query.eq('read', false)
        break
      case 'mark_read':
        if (!notification_ids || !Array.isArray(notification_ids)) {
          return NextResponse.json({ 
            error: 'notification_ids array is required for mark_read action' 
          }, { status: 400 })
        }
        updateData.read = true
        query = query.in('id', notification_ids)
        break
      case 'mark_unread':
        if (!notification_ids || !Array.isArray(notification_ids)) {
          return NextResponse.json({ 
            error: 'notification_ids array is required for mark_unread action' 
          }, { status: 400 })
        }
        updateData.read = false
        query = query.in('id', notification_ids)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data, error } = await query.select()

    if (error) {
      console.error('Error updating notifications:', error)
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Notifications updated successfully',
      updated_count: data?.length || 0
    })
  } catch (error) {
    console.error('Error in notifications PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}