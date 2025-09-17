'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const PaymentPage = () => {
  const [amount, setAmount] = useState<number>(50);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handlePaymentSuccess = (data: any) => {
    console.log('Payment successful:', data);
    setPaymentData(data);
    setPaymentCompleted(true);
    toast.success('Payment completed successfully!');
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
  };

  const resetPayment = () => {
    setShowPayment(false);
    setPaymentCompleted(false);
    setPaymentData(null);
    setAmount(50);
  };

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Your payment has been processed successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Payment Details:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">${paymentData?.amount} {paymentData?.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-medium capitalize">{paymentData?.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-600">Completed</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={resetPayment} variant="outline" className="flex-1">
                  Make Another Payment
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Demo</h1>
          <p className="text-gray-600">
            Test the integrated Stripe and PayPal payment methods
          </p>
        </div>

        {!showPayment ? (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Set Payment Amount</CardTitle>
              <CardDescription>
                Enter the amount you want to pay for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    max="1000"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    placeholder="50.00"
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => setShowPayment(true)}
                disabled={amount <= 0}
                className="w-full"
                size="lg"
              >
                Proceed to Payment
              </Button>
              
              <div className="text-xs text-gray-500 text-center">
                This is a demo. Use test payment methods only.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <Button 
                onClick={() => setShowPayment(false)}
                variant="outline"
                size="sm"
              >
                ← Change Amount
              </Button>
            </div>
            
            <PaymentMethodSelector
              amount={amount}
              currency="USD"
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              description="Demo payment for InkLink services"
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Test Payment Information:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Stripe Test Card:</strong> 4242 4242 4242 4242</p>
                <p><strong>PayPal:</strong> Use sandbox account or test credentials</p>
                <p><strong>Expiry:</strong> Any future date</p>
                <p><strong>CVC:</strong> Any 3 digits</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;