-- Cycling Fantasy Game Database Setup
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Riders table (UCI Professional Cyclists)
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    nationality TEXT,
    team TEXT,
    uci_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Races table
CREATE TABLE races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    is_monument BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Race participants (which riders are in which race)
CREATE TABLE race_riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    UNIQUE(race_id, rider_id)
);

-- Top 10 candidates per race (configured by admin)
CREATE TABLE top_10_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    display_order INTEGER,
    UNIQUE(race_id, rider_id)
);

-- Head to Head options per race
CREATE TABLE head_to_head (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    rider_a_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    rider_b_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    UNIQUE(race_id, rider_a_id, rider_b_id)
);

-- User predictions
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, race_id)
);

-- Top 3 predictions
CREATE TABLE prediction_top3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    position INTEGER CHECK (position BETWEEN 1 AND 3),
    UNIQUE(prediction_id, position)
);

-- Top 10 ranking predictions
CREATE TABLE prediction_top10 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    predicted_position INTEGER CHECK (predicted_position BETWEEN 1 AND 10),
    UNIQUE(prediction_id, predicted_position),
    UNIQUE(prediction_id, rider_id)
);

-- Head to Head prediction
CREATE TABLE prediction_h2h (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
    h2h_id UUID REFERENCES head_to_head(id) ON DELETE CASCADE,
    selected_rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    UNIQUE(prediction_id)
);

-- User profiles (extended user info)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_race_riders_race ON race_riders(race_id);
CREATE INDEX idx_race_riders_rider ON race_riders(rider_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_race ON predictions(race_id);
CREATE INDEX idx_riders_lastname ON riders(last_name);

-- Enable Row Level Security
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_10_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE head_to_head ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_top3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_top10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_h2h ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Riders: Everyone can read
CREATE POLICY "Riders are viewable by everyone" ON riders FOR SELECT USING (true);
CREATE POLICY "Only admins can insert riders" ON riders FOR INSERT
    WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can update riders" ON riders FOR UPDATE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Races: Everyone can read, only admins can modify
CREATE POLICY "Races are viewable by everyone" ON races FOR SELECT USING (true);
CREATE POLICY "Only admins can create races" ON races FOR INSERT
    WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can update races" ON races FOR UPDATE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can delete races" ON races FOR DELETE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Race riders: Everyone can read, only admins can modify
CREATE POLICY "Race riders are viewable by everyone" ON race_riders FOR SELECT USING (true);
CREATE POLICY "Only admins can manage race riders" ON race_riders FOR ALL
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Top 10 candidates: Everyone can read, only admins can modify
CREATE POLICY "Top 10 candidates viewable by everyone" ON top_10_candidates FOR SELECT USING (true);
CREATE POLICY "Only admins can manage top 10" ON top_10_candidates FOR ALL
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Head to Head: Everyone can read, only admins can modify
CREATE POLICY "H2H viewable by everyone" ON head_to_head FOR SELECT USING (true);
CREATE POLICY "Only admins can manage H2H" ON head_to_head FOR ALL
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Predictions: Users can only see and modify their own
CREATE POLICY "Users can view their own predictions" ON predictions FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own predictions" ON predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own predictions" ON predictions FOR UPDATE
    USING (auth.uid() = user_id);

-- Prediction details follow same pattern
CREATE POLICY "Users can view their own top3" ON prediction_top3 FOR SELECT
    USING (EXISTS (SELECT 1 FROM predictions WHERE id = prediction_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their own top3" ON prediction_top3 FOR ALL
    USING (EXISTS (SELECT 1 FROM predictions WHERE id = prediction_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their own top10" ON prediction_top10 FOR SELECT
    USING (EXISTS (SELECT 1 FROM predictions WHERE id = prediction_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their own top10" ON prediction_top10 FOR ALL
    USING (EXISTS (SELECT 1 FROM predictions WHERE id = prediction_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their own h2h" ON prediction_h2h FOR SELECT
    USING (EXISTS (SELECT 1 FROM predictions WHERE id = prediction_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their own h2h" ON prediction_h2h FOR ALL
    USING (EXISTS (SELECT 1 FROM predictions WHERE id = prediction_id AND user_id = auth.uid()));

-- Profiles: Users can view all profiles, only update their own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT
    USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (new.id, new.email, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to check if race registration is still open
CREATE OR REPLACE FUNCTION is_registration_open(race_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT registration_deadline > NOW()
    FROM races
    WHERE id = race_uuid;
$$ LANGUAGE SQL STABLE;
