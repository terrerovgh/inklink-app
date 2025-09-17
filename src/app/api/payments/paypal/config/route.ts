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

    // Return PayPal client ID (safe to expose to client)
    const config = {
      client_id: process.env.PAYPAL_CLIENT_ID,
      currency: 'EUR',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    }

    if (!config.client_id) {
      return NextResponse.json(
        { error: 'PayPal no está configurado' },
        { status: 500 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error getting PayPal config:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}