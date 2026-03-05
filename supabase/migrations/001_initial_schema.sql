-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Businesses table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auth
  owner_id UUID REFERENCES auth.users(id),
  
  -- Business info
  name TEXT NOT NULL,
  trade TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  
  -- Twilio
  twilio_phone_number TEXT,
  twilio_phone_sid TEXT,
  forward_from_number TEXT,
  
  -- Settings
  greeting_text TEXT,
  business_hours JSONB,
  notification_phones TEXT[],
  notification_emails TEXT[],
  max_call_duration_seconds INT DEFAULT 180,
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

-- Calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Twilio call data
  twilio_call_sid TEXT UNIQUE NOT NULL,
  caller_phone TEXT,
  duration_seconds INT,
  recording_url TEXT,
  recording_duration_seconds INT,
  
  -- AI extraction
  caller_name TEXT,
  service_needed TEXT,
  urgency TEXT DEFAULT 'routine',
  preferred_callback TEXT,
  full_transcript TEXT,
  extraction_json JSONB,
  
  -- Status
  lead_status TEXT DEFAULT 'new',
  
  -- Notifications
  sms_sent_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  notification_latency_ms INT
);

-- Trade prompts table
CREATE TABLE trade_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT UNIQUE NOT NULL,
  system_prompt TEXT NOT NULL,
  greeting_template TEXT NOT NULL,
  emergency_keywords TEXT[] NOT NULL,
  common_services TEXT[] NOT NULL
);

-- Indexes
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_twilio_phone ON businesses(twilio_phone_number);
CREATE INDEX idx_calls_business_id ON calls(business_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX idx_calls_lead_status ON calls(lead_status);

-- Row-Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Business policies: owners can only see their own business
CREATE POLICY "Users can view own business" ON businesses
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update own business" ON businesses
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own business" ON businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Call policies: users can see calls for their business
CREATE POLICY "Users can view own calls" ON calls
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update own calls" ON calls
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Service role can do everything (for voice server)
CREATE POLICY "Service role full access businesses" ON businesses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access calls" ON calls
  FOR ALL USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);

CREATE POLICY "Service role can upload recordings" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recordings' AND auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read own recordings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recordings' AND
    auth.role() = 'authenticated'
  );
