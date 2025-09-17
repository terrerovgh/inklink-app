import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('payment_method')
    const type = searchParams.get('type') // 'sent' or 'received'
    
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('payment_intents')
      .select(`
        *,
        client:profiles!payment_intents_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })

    // Filter by user involvement (as client or artist)
    if (type === 'sent') {
      // Payments sent by this user (as client)
      query = query.eq('user_id', user.id)
    } else if (type === 'received') {
      // Payments received by this user (as artist/studio)
      query = query.eq('metadata->>artist_id', user.id)
    } else {
      // All payments involving this user
      query = query.or(`user_id.eq.${user.id},metadata->>artist_id.eq.${user.id}`)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: payments, error, count } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Error al obtener los pagos' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      payments: payments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Get payment statistics for the user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'get_stats') {
      // Get payment statistics
      const { data: sentPayments } = await supabase
        .from('payment_intents')
        .select('amount, currency, status')
        .eq('user_id', user.id)

      const { data: receivedPayments } = await supabase
        .from('payment_intents')
        .select('amount, currency, status')
        .eq('metadata->>artist_id', user.id)

      // Calculate statistics
      const stats = {
        sent: {
          total: sentPayments?.length || 0,
          completed: sentPayments?.filter(p => p.status === 'completed').length || 0,
          pending: sentPayments?.filter(p => p.status === 'pending').length || 0,
          failed: sentPayments?.filter(p => p.status === 'failed').length || 0,
          totalAmount: sentPayments
            ?.filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0) || 0
        },
        received: {
          total: receivedPayments?.length || 0,
          completed: receivedPayments?.filter(p => p.status === 'completed').length || 0,
          pending: receivedPayments?.filter(p => p.status === 'pending').length || 0,
          failed: receivedPayments?.filter(p => p.status === 'failed').length || 0,
          totalAmount: receivedPayments
            ?.filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0) || 0
        }
      }

      // Get recent payments
      const { data: recentPayments } = await supabase
        .from('payment_intents')
        .select(`
          *,
          client:profiles!payment_intents_user_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`user_id.eq.${user.id},metadata->>artist_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5)

      return NextResponse.json({
        stats,
        recentPayments: recentPayments || []
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error processing payment request:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}