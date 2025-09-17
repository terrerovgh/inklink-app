'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Wallet } from 'lucide-react';
import PayPalButton from './PayPalButton';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

interface PaymentMethodSelectorProps {
  amount: number;
  currency?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: any) => void;
  disabled?: boolean;
  description?: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  description = 'Complete your payment'
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create payment intent on the server
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          payment_method_types: ['card']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to Stripe Checkout or use Elements
      const { error } = await stripe.redirectToCheckout({
        sessionId: client_secret
      });

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error('Stripe payment failed. Please try again.');
      onPaymentError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalSuccess = (details: any) => {
    onPaymentSuccess?.({
      method: 'paypal',
      details,
      amount,
      currency
    });
  };

  const handlePayPalError = (error: any) => {
    onPaymentError?.(error);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Payment Method
        </CardTitle>
        <CardDescription>
          {description} - ${amount.toFixed(2)} {currency}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value: string) => setSelectedMethod(value as 'stripe' | 'paypal')}
          disabled={disabled || isProcessing}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="stripe" id="stripe" />
            <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
              <CreditCard className="h-4 w-4" />
              Credit/Debit Card (Stripe)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paypal" id="paypal" />
            <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
              <Wallet className="h-4 w-4" />
              PayPal
            </Label>
          </div>
        </RadioGroup>

        <div className="payment-method-content">
          {selectedMethod === 'stripe' && (
            <div className="space-y-4">
              <Button
                onClick={handleStripePayment}
                disabled={disabled || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)} with Stripe`}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Secure payment powered by Stripe
              </p>
            </div>
          )}

          {selectedMethod === 'paypal' && (
            <div className="space-y-4">
              <PayPalButton
                amount={amount.toString()}
                currency={currency}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                disabled={disabled || isProcessing}
              />
              <p className="text-xs text-muted-foreground text-center">
                Secure payment powered by PayPal
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;