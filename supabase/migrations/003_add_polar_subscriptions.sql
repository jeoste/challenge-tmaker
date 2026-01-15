-- Create polar_subscriptions table to track Polar.sh subscriptions
CREATE TABLE IF NOT EXISTS polar_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    polar_subscription_id TEXT NOT NULL UNIQUE,
    polar_customer_id TEXT,
    status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'unpaid', etc.
    plan_id TEXT NOT NULL, -- UNEARTH_MONTHLY_PLAN or other plan IDs
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_polar_subscriptions_user_id ON polar_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_polar_subscriptions_polar_id ON polar_subscriptions(polar_subscription_id);
CREATE INDEX IF NOT EXISTS idx_polar_subscriptions_status ON polar_subscriptions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE polar_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polar_subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON polar_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Only server-side operations can insert/update subscriptions (via service role)
-- Users cannot directly modify their subscriptions
