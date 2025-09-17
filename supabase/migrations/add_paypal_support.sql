-- Add PayPal support to payments table
-- This migration adds columns and updates the payments table to support PayPal payments

-- Add PayPal-specific columns to payments table if they don't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT;

-- Update payment_method enum to include paypal if not already present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('stripe', 'paypal', 'cash');
    ELSE
        -- Add paypal to existing enum if not present
        BEGIN
            ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'paypal';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- Update payment_method column to use the enum if it's not already
DO $$
BEGIN
    -- Check if column exists and is not already using the enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'payment_method' 
        AND data_type != 'USER-DEFINED'
    ) THEN
        -- Convert existing column to use enum
        ALTER TABLE payments 
        ALTER COLUMN payment_method TYPE payment_method_enum 
        USING payment_method::payment_method_enum;
    END IF;
END $$;

-- Create index on PayPal-specific columns for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON payments(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_paypal_capture_id ON payments(paypal_capture_id) WHERE paypal_capture_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.paypal_order_id IS 'PayPal order ID for tracking PayPal payments';
COMMENT ON COLUMN payments.paypal_capture_id IS 'PayPal capture ID when payment is captured';
COMMENT ON COLUMN payments.paypal_payer_id IS 'PayPal payer ID for the customer';

-- Update RLS policies to ensure proper access control
-- Grant permissions to authenticated users for PayPal payments
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
GRANT SELECT ON payments TO anon;

-- Create or update RLS policy for PayPal payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT user_id FROM profiles WHERE id = payments.artist_id
    ));

DROP POLICY IF EXISTS "Users can create payments" ON payments;
CREATE POLICY "Users can create payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payments" ON payments;
CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;