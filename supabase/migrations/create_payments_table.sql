-- Create payments table for handling Stripe and PayPal payments
-- This table stores payment information for tattoo services

-- Create payment status enum
CREATE TYPE payment_status_enum AS ENUM (
    'pending',
    'processing', 
    'completed',
    'failed',
    'cancelled',
    'refunded'
);

-- Create payment method enum
CREATE TYPE payment_method_enum AS ENUM (
    'stripe',
    'paypal',
    'cash'
);

-- Create payments table
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    service_id UUID, -- Reference to tattoo service/request
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method payment_method_enum NOT NULL,
    status payment_status_enum NOT NULL DEFAULT 'pending',
    
    -- Stripe-specific fields
    payment_intent_id TEXT, -- Stripe payment intent ID
    stripe_customer_id TEXT, -- Stripe customer ID
    
    -- PayPal-specific fields
    paypal_order_id TEXT, -- PayPal order ID
    paypal_capture_id TEXT, -- PayPal capture ID
    paypal_payer_id TEXT, -- PayPal payer ID
    
    -- Additional metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT payments_stripe_check CHECK (
        (payment_method = 'stripe' AND payment_intent_id IS NOT NULL) OR
        (payment_method = 'paypal' AND paypal_order_id IS NOT NULL) OR
        (payment_method = 'cash')
    )
);

-- Create indexes for better performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_artist_id ON payments(artist_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_stripe_intent ON payments(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX idx_payments_paypal_order ON payments(paypal_order_id) WHERE paypal_order_id IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = artist_id OR
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = payments.artist_id
        )
    );

CREATE POLICY "Users can create payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = artist_id
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
GRANT SELECT ON payments TO anon;

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Stores payment information for tattoo services';
COMMENT ON COLUMN payments.user_id IS 'ID of the user making the payment';
COMMENT ON COLUMN payments.artist_id IS 'ID of the artist receiving the payment';
COMMENT ON COLUMN payments.service_id IS 'ID of the tattoo service being paid for';
COMMENT ON COLUMN payments.amount IS 'Payment amount in the specified currency';
COMMENT ON COLUMN payments.currency IS 'Currency code (e.g., USD, EUR)';
COMMENT ON COLUMN payments.payment_method IS 'Payment method used (stripe, paypal, cash)';
COMMENT ON COLUMN payments.status IS 'Current status of the payment';
COMMENT ON COLUMN payments.payment_intent_id IS 'Stripe payment intent ID';
COMMENT ON COLUMN payments.paypal_order_id IS 'PayPal order ID';
COMMENT ON COLUMN payments.paypal_capture_id IS 'PayPal capture ID';
COMMENT ON COLUMN payments.metadata IS 'Additional payment metadata as JSON';