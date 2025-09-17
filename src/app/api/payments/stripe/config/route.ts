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

    // Return Stripe publishable key (safe to expose to client)
    const config = {
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
      currency: 'EUR',
      country: 'ES'
    }

    if (!config.publishable_key) {
      return NextResponse.json(
        { error: 'Stripe no está configurado' },
        { status: 500 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error getting Stripe config:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}