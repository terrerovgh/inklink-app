import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

interface PaymentIntentRequest {
  amount: number // in cents
  currency: string
  payment_method: 'stripe' | 'paypal'
  description: string
  metadata: {
    offer_id?: string
    service_type?: string
    client_id: string
    artist_id: string
  }
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

    const body: PaymentIntentRequest = await request.json()
    const { amount, currency, payment_method, description, metadata } = body

    // Validate request
    if (!amount || amount < 50) { // Minimum 0.50 EUR
      return NextResponse.json(
        { error: 'Monto mínimo es 0.50 EUR' },
        { status: 400 }
      )
    }

    if (!['stripe', 'paypal'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Método de pago no válido' },
        { status: 400 }
      )
    }

    // Verify user is the client in the transaction
    if (metadata.client_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado para este pago' },
        { status: 403 }
      )
    }

    let paymentIntentId: string
    let clientSecret: string | undefined
    let paypalOrderId: string | undefined

    // Create payment intent in database first
    const { data: paymentIntent, error: dbError } = await supabase
      .from('payment_intents')
      .insert({
        amount,
        currency: currency.toUpperCase(),
        status: 'pending',
        payment_method,
        description,
        metadata,
        user_id: user.id
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Error al crear intención de pago' },
        { status: 500 }
      )
    }

    paymentIntentId = paymentIntent.id

    try {
      if (payment_method === 'stripe') {
        // Create Stripe PaymentIntent
        const stripePaymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: currency.toLowerCase(),
          description,
          metadata: {
            payment_intent_id: paymentIntentId,
            offer_id: metadata.offer_id || '',
            service_type: metadata.service_type || '',
            client_id: metadata.client_id,
            artist_id: metadata.artist_id
          },
          automatic_payment_methods: {
            enabled: true
          }
        })

        clientSecret = stripePaymentIntent.client_secret!

        // Update database with Stripe payment intent ID
        await supabase
          .from('payment_intents')
          .update({ 
            external_id: stripePaymentIntent.id,
            status: 'processing'
          })
          .eq('id', paymentIntentId)

      } else if (payment_method === 'paypal') {
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

        // Create PayPal order
        const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': paymentIntentId
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
              reference_id: paymentIntentId,
              description,
              amount: {
                currency_code: currency.toUpperCase(),
                value: (amount / 100).toFixed(2)
              }
            }],
            application_context: {
              brand_name: 'InkLink',
              landing_page: 'NO_PREFERENCE',
              user_action: 'PAY_NOW',
              return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
              cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel`
            }
          })
        })

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json()
          console.error('PayPal order creation error:', errorData)
          throw new Error('Failed to create PayPal order')
        }

        const orderData = await orderResponse.json()
        paypalOrderId = orderData.id

        // Update database with PayPal order ID
        await supabase
          .from('payment_intents')
          .update({ 
            external_id: paypalOrderId,
            status: 'processing'
          })
          .eq('id', paymentIntentId)
      }

      // Return response based on payment method
      const response: any = {
        payment_intent: paymentIntent,
        payment_method
      }

      if (payment_method === 'stripe') {
        response.client_secret = clientSecret
      } else if (payment_method === 'paypal') {
        response.paypal_order_id = paypalOrderId
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error(`${payment_method} error:`, error)
      
      // Update payment intent status to failed
      await supabase
        .from('payment_intents')
        .update({ status: 'failed' })
        .eq('id', paymentIntentId)

      return NextResponse.json(
        { error: `Error al crear pago con ${payment_method}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}