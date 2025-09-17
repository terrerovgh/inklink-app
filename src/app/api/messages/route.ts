import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const before = searchParams.get('before') // For pagination by timestamp

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      )
    }

    // Verify user is part of the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const isParticipant = conversation.participant_1_id === userProfile.id || 
                         conversation.participant_2_id === userProfile.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Forbidden - You are not part of this conversation' },
        { status: 403 }
      )
    }

    let query = supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        attachments,
        is_read,
        created_at,
        updated_at,
        profiles!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add timestamp filter for pagination
    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Mark messages as read for the current user
    if (messages && messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => msg.sender_id !== userProfile.id && !msg.is_read)
        .map(msg => msg.id)

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('message_reads')
          .upsert(
            unreadMessageIds.map(messageId => ({
              message_id: messageId,
              reader_id: userProfile.id,
              read_at: new Date().toISOString()
            }))
          )
      }
    }

    return NextResponse.json({
      messages: messages || [],
      total: messages?.length || 0,
      offset,
      limit,
      hasMore: messages?.length === limit
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

    // Get user's profile
    const { data: senderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !senderProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      conversation_id,
      recipient_id,
      content,
      message_type = 'text',
      attachments
    } = body

    // Validate required fields
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    let conversationId = conversation_id

    // If no conversation_id provided, create or find existing conversation
    if (!conversationId && recipient_id) {
      // Check if conversation already exists between these users
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${senderProfile.id},participant_2_id.eq.${recipient_id}),and(participant_1_id.eq.${recipient_id},participant_2_id.eq.${senderProfile.id})`)
        .single()

      if (existingConversation) {
        conversationId = existingConversation.id
      } else {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: senderProfile.id,
            participant_2_id: recipient_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (convError || !newConversation) {
          console.error('Error creating conversation:', convError)
          return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 500 }
          )
        }

        conversationId = newConversation.id
      }
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id or recipient_id is required' },
        { status: 400 }
      )
    }

    // Verify user is part of the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const isParticipant = conversation.participant_1_id === senderProfile.id || 
                         conversation.participant_2_id === senderProfile.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Forbidden - You are not part of this conversation' },
        { status: 403 }
      )
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderProfile.id,
        content: content.trim(),
        message_type,
        attachments: attachments || [],
        is_active: true
      })
      .select(`
        *,
        profiles!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    return NextResponse.json({ message }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}