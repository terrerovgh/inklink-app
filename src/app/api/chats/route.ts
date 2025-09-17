import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Fetch user's chats with participant profiles and last message
    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        *,
        participant1_profile:profiles!chats_participant1_id_fkey (
          id,
          full_name,
          avatar_url,
          user_type
        ),
        participant2_profile:profiles!chats_participant2_id_fkey (
          id,
          full_name,
          avatar_url,
          user_type
        ),
        messages!inner (
          id,
          content,
          created_at,
          message_type,
          sender_id
        )
      `)
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching chats:', error)
      return NextResponse.json(
        { error: 'Error al obtener los chats' },
        { status: 500 }
      )
    }

    // Process chats to include last message and unread count
    const processedChats = await Promise.all(
      (chats || []).map(async (chat) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('sender_id', user.id)
          .eq('read', false)

        return {
          ...chat,
          last_message: lastMessage,
          unread_count: unreadCount || 0
        }
      })
    )

    return NextResponse.json({
      chats: processedChats,
      pagination: {
        page,
        limit,
        total: processedChats.length
      }
    })
  } catch (error) {
    console.error('Error in GET /api/chats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { participant_id } = body

    if (!participant_id) {
      return NextResponse.json(
        { error: 'ID del participante es requerido' },
        { status: 400 }
      )
    }

    if (participant_id === user.id) {
      return NextResponse.json(
        { error: 'No puedes crear un chat contigo mismo' },
        { status: 400 }
      )
    }

    // Check if participant exists
    const { data: participant, error: participantError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, user_type')
      .eq('id', participant_id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Check if chat already exists
    const { data: existingChat, error: searchError } = await supabase
      .from('chats')
      .select(`
        *,
        participant1_profile:profiles!chats_participant1_id_fkey (
          id,
          full_name,
          avatar_url,
          user_type
        ),
        participant2_profile:profiles!chats_participant2_id_fkey (
          id,
          full_name,
          avatar_url,
          user_type
        )
      `)
      .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${participant_id}),and(participant1_id.eq.${participant_id},participant2_id.eq.${user.id})`)
      .single()

    if (existingChat) {
      return NextResponse.json({
        chat: existingChat,
        message: 'Chat ya existe'
      })
    }

    // Create new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({
        participant1_id: user.id,
        participant2_id: participant_id,
        last_message_at: new Date().toISOString()
      })
      .select(`
        *,
        participant1_profile:profiles!chats_participant1_id_fkey (
          id,
          full_name,
          avatar_url,
          user_type
        ),
        participant2_profile:profiles!chats_participant2_id_fkey (
          id,
          full_name,
          avatar_url,
          user_type
        )
      `)
      .single()

    if (createError) {
      console.error('Error creating chat:', createError)
      return NextResponse.json(
        { error: 'Error al crear el chat' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      chat: newChat,
      message: 'Chat creado exitosamente'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/chats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}