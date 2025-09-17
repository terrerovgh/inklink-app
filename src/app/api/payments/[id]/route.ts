import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const paymentIntentId = id

    // Get payment intent with user verification
    const { data: paymentIntent, error } = await supabase
      .from('payment_intents')
      .select(`
        *,
        client:profiles!payment_intents_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', paymentIntentId)
      .single()

    if (error || !paymentIntent) {
      return NextResponse.json(
        { error: 'Intención de pago no encontrada' },
        { status: 404 }
      )
    }

    // Check if user has access to this payment intent
    const hasAccess = paymentIntent.user_id === user.id || 
                     paymentIntent.metadata?.artist_id === user.id ||
                     paymentIntent.metadata?.client_id === user.id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No autorizado para ver este pago' },
        { status: 403 }
      )
    }

    return NextResponse.json({ payment_intent: paymentIntent })

  } catch (error) {
    console.error('Error fetching payment intent:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const paymentIntentId = id
    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      )
    }

    // Get current payment intent
    const { data: currentPayment, error: fetchError } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', paymentIntentId)
      .single()

    if (fetchError || !currentPayment) {
      return NextResponse.json(
        { error: 'Intención de pago no encontrada' },
        { status: 404 }
      )
    }

    // Check if user has permission to update this payment
    const hasPermission = currentPayment.user_id === user.id || 
                         currentPayment.metadata?.artist_id === user.id

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No autorizado para actualizar este pago' },
        { status: 403 }
      )
    }

    // Update payment intent
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payment_intents')
      .update(updateData)
      .eq('id', paymentIntentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating payment intent:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el pago' },
        { status: 500 }
      )
    }

    // Handle status-specific actions
    if (status === 'completed' && currentPayment.status !== 'completed') {
      // Create notification for artist/studio
      if (currentPayment.metadata?.artist_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: currentPayment.metadata.artist_id,
            type: 'payment_received',
            title: 'Pago recibido',
            message: `Has recibido un pago de ${(currentPayment.amount / 100).toFixed(2)} ${currentPayment.currency}`,
            metadata: {
              payment_intent_id: paymentIntentId,
              amount: currentPayment.amount,
              currency: currentPayment.currency,
              client_id: currentPayment.metadata.client_id
            }
          })
      }

      // Update related offer status if applicable
      if (currentPayment.metadata?.offer_id) {
        await supabase
          .from('offers')
          .update({ 
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentPayment.metadata.offer_id)
      }
    }

    if (status === 'cancelled' && currentPayment.status !== 'cancelled') {
      // Create notification for client
      await supabase
        .from('notifications')
        .insert({
          user_id: currentPayment.user_id,
          type: 'payment_cancelled',
          title: 'Pago cancelado',
          message: `Tu pago de ${(currentPayment.amount / 100).toFixed(2)} ${currentPayment.currency} ha sido cancelado`,
          metadata: {
            payment_intent_id: paymentIntentId,
            amount: currentPayment.amount,
            currency: currentPayment.currency
          }
        })

      // Update related offer status if applicable
      if (currentPayment.metadata?.offer_id) {
        await supabase
          .from('offers')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentPayment.metadata.offer_id)
      }
    }

    return NextResponse.json({ payment_intent: updatedPayment })

  } catch (error) {
    console.error('Error updating payment intent:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const paymentIntentId = params.id

    // Get current payment intent
    const { data: currentPayment, error: fetchError } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', paymentIntentId)
      .single()

    if (fetchError || !currentPayment) {
      return NextResponse.json(
        { error: 'Intención de pago no encontrada' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete this payment
    if (currentPayment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado para eliminar este pago' },
        { status: 403 }
      )
    }

    // Only allow deletion of pending or failed payments
    if (!['pending', 'failed', 'cancelled'].includes(currentPayment.status)) {
      return NextResponse.json(
        { error: 'No se puede eliminar un pago completado o en proceso' },
        { status: 400 }
      )
    }

    // Delete payment intent
    const { error: deleteError } = await supabase
      .from('payment_intents')
      .delete()
      .eq('id', paymentIntentId)

    if (deleteError) {
      console.error('Error deleting payment intent:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar el pago' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Pago eliminado exitosamente' })

  } catch (error) {
    console.error('Error deleting payment intent:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}