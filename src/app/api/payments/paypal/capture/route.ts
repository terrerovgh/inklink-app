import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

interface CaptureRequest {
  order_id: string
  payment_intent_id: string
}

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

    const body: CaptureRequest = await request.json()
    const { order_id, payment_intent_id } = body

    if (!order_id || !payment_intent_id) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Verify payment intent belongs to user
    const { data: paymentIntent, error: piError } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', payment_intent_id)
      .eq('user_id', user.id)
      .single()

    if (piError || !paymentIntent) {
      return NextResponse.json(
        { error: 'Intención de pago no encontrada' },
        { status: 404 }
      )
    }

    if (paymentIntent.external_id !== order_id) {
      return NextResponse.json(
        { error: 'ID de orden no coincide' },
        { status: 400 }
      )
    }

    try {
      // Get PayPal access token
      const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to get PayPal access token')
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      // Capture the PayPal order
      const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${order_id}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `${payment_intent_id}-capture`
        }
      })

      if (!captureResponse.ok) {
        const errorData = await captureResponse.json()
        console.error('PayPal capture error:', errorData)
        throw new Error('Failed to capture PayPal payment')
      }

      const captureData = await captureResponse.json()
      
      // Check if capture was successful
      if (captureData.status === 'COMPLETED') {
        // Update payment intent status
        const { error: updateError } = await supabase
          .from('payment_intents')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            external_response: captureData
          })
          .eq('id', payment_intent_id)

        if (updateError) {
          console.error('Error updating payment intent:', updateError)
          throw new Error('Failed to update payment status')
        }

        // Create notification for artist/studio
        if (paymentIntent.metadata?.artist_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: paymentIntent.metadata.artist_id,
              type: 'payment_received',
              title: 'Pago recibido',
              message: `Has recibido un pago de ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency}`,
              metadata: {
                payment_intent_id: payment_intent_id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                client_id: paymentIntent.metadata.client_id
              }
            })
        }

        // If this is for an offer, update offer status
        if (paymentIntent.metadata?.offer_id) {
          await supabase
            .from('offers')
            .update({ 
              status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentIntent.metadata.offer_id)
        }

        return NextResponse.json({
          status: 'COMPLETED',
          capture_id: captureData.id,
          payment_intent_id: payment_intent_id
        })
      } else {
        // Payment not completed
        await supabase
          .from('payment_intents')
          .update({ 
            status: 'failed',
            external_response: captureData
          })
          .eq('id', payment_intent_id)

        return NextResponse.json(
          { error: 'El pago no se completó correctamente' },
          { status: 400 }
        )
      }

    } catch (error) {
      console.error('PayPal capture error:', error)
      
      // Update payment intent status to failed
      await supabase
        .from('payment_intents')
        .update({ status: 'failed' })
        .eq('id', payment_intent_id)

      return NextResponse.json(
        { error: 'Error al capturar el pago de PayPal' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error capturing PayPal payment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}