-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  -- Pricing
  ticket_price DECIMAL(10,2) NOT NULL CHECK (ticket_price > 0),
  max_attendees INTEGER NOT NULL CHECK (max_attendees > 0),
  fee_model TEXT DEFAULT 'buyer_pays' CHECK (fee_model IN ('buyer_pays', 'organizer_pays')),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ended', 'cancelled')),
  payout_completed BOOLEAN DEFAULT FALSE,
  
  -- Images
  cover_image_url TEXT,
  
  -- Monime
  monime_financial_account_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ticket info
  ticket_number INTEGER NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  
  -- Pricing snapshot
  ticket_price DECIMAL(10,2) NOT NULL,
  pricing_tier TEXT NOT NULL,
  tier_discount DECIMAL(5,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  platform_fee_percentage DECIMAL(5,2) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  organizer_amount DECIMAL(10,2) NOT NULL,
  buyer_saved DECIMAL(10,2) DEFAULT 0,
  
  -- Payment
  monime_checkout_session_id TEXT UNIQUE,
  monime_payment_status TEXT DEFAULT 'pending' CHECK (monime_payment_status IN ('pending', 'paid', 'failed', 'expired')),
  payment_processor_fee DECIMAL(10,2),
  
  -- Check-in
  is_checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id, ticket_number)
);

-- Payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Amounts
  total_tickets_sold INTEGER NOT NULL,
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fees DECIMAL(10,2) NOT NULL,
  monime_fees DECIMAL(10,2) NOT NULL,
  net_payout DECIMAL(10,2) NOT NULL,
  
  -- Monime payout
  monime_payout_id TEXT UNIQUE,
  monime_payout_status TEXT DEFAULT 'pending' CHECK (monime_payout_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Recipient
  recipient_phone TEXT NOT NULL,
  payment_method TEXT DEFAULT 'mobile_money',
  
  -- Timestamps
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (extend auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_organizer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX idx_tickets_payment_status ON tickets(monime_payment_status);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_payouts_event_id ON payouts(event_id);
CREATE INDEX idx_payouts_organizer_id ON payouts(organizer_id);

-- Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Events: Anyone can read published events, organizers can manage their own
CREATE POLICY "Public events are viewable by everyone" ON events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Organizers can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (auth.uid() = organizer_id);

-- Tickets: Users can view their own tickets
CREATE POLICY "Users can view their own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view tickets for their events" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = tickets.event_id 
      AND events.organizer_id = auth.uid()
    )
  );

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to get current ticket count for an event
CREATE OR REPLACE FUNCTION get_event_ticket_count(event_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM tickets 
  WHERE event_id = event_uuid 
  AND monime_payment_status = 'paid';
$$ LANGUAGE SQL STABLE;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to events table
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();