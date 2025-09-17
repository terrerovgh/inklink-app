import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const chatId = id

    // Fetch chat with participant profiles
    const { data: chat, error: chatError } = await supabase
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
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat no encontrado' },
        { status: 404 }
      )
    }

    // Check if user is participant
    if (chat.participant1_id !== user.id && chat.participant2_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes acceso a este chat' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Fetch messages with sender profiles
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Error al obtener los mensajes' },
        { status: 500 }
      )
    }

    // Mark messages as read for the current user
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      chat,
      messages: messages?.reverse() || [],
      pagination: {
        page,
        limit,
        total: messages?.length || 0
      }
    })
  } catch (error) {
    console.error('Error in GET /api/chats/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const chatId = id

    // Check if chat exists and user is participant
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat no encontrado' },
        { status: 404 }
      )
    }

    if (chat.participant1_id !== user.id && chat.participant2_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes acceso a este chat' },
        { status: 403 }
      )
    }

    // Delete all messages in the chat first
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId)

    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
      return NextResponse.json(
        { error: 'Error al eliminar los mensajes' },
        { status: 500 }
      )
    }

    // Delete the chat
    const { error: deleteError } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (deleteError) {
      console.error('Error deleting chat:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar el chat' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Chat eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error in DELETE /api/chats/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}