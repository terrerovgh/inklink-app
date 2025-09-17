'use client';

import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'sonner';

interface PayPalButtonProps {
  amount: string;
  currency?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
  disabled = false
}) => {
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: currency,
    intent: 'capture'
  };

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount
          },
          description: 'InkLink Tattoo Service Payment'
        }
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING'
      }
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      const details = await actions.order.capture();
      toast.success('Payment completed successfully!');
      onSuccess?.(details);
    } catch (error) {
      console.error('PayPal payment error:', error);
      toast.error('Payment failed. Please try again.');
      onError?.(error);
    }
  };

  const onErrorHandler = (error: any) => {
    console.error('PayPal error:', error);
    toast.error('Payment error occurred.');
    onError?.(error);
  };

  const onCancelHandler = () => {
    toast.info('Payment was cancelled.');
    onCancel?.();
  };

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          PayPal is not configured. Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="paypal-button-container">
      <PayPalScriptProvider options={paypalOptions}>
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          }}
          disabled={disabled}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onErrorHandler}
          onCancel={onCancelHandler}
        />
      </PayPalScriptProvider>
    </div>
  );
};

export default PayPalButton;