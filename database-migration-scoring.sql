-- Scoring System Migration
-- Run this in your Supabase SQL Editor AFTER the initial database-setup.sql

-- Race Results: Actual top 3 finish
CREATE TABLE race_results_top3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    position INTEGER CHECK (position BETWEEN 1 AND 3),
    UNIQUE(race_id, position),
    UNIQUE(race_id, rider_id)
);

-- Race Results: Actual top 10 finish order (for the 10 candidates)
CREATE TABLE race_results_top10 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    actual_position INTEGER CHECK (actual_position BETWEEN 1 AND 10),
    UNIQUE(race_id, rider_id)
);

-- Race Results: H2H winner
CREATE TABLE race_results_h2h (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    h2h_id UUID REFERENCES head_to_head(id) ON DELETE CASCADE,
    winning_rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
    UNIQUE(race_id)
);

-- Scores per user per race (calculated and stored for fast lookups)
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    top3_score INTEGER DEFAULT 0,
    top10_score INTEGER DEFAULT 0,
    h2h_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, race_id)
);

-- Indexes
CREATE INDEX idx_race_results_top3_race ON race_results_top3(race_id);
CREATE INDEX idx_race_results_top10_race ON race_results_top10(race_id);
CREATE INDEX idx_race_results_h2h_race ON race_results_h2h(race_id);
CREATE INDEX idx_scores_user ON scores(user_id);
CREATE INDEX idx_scores_race ON scores(race_id);

-- Enable RLS
ALTER TABLE race_results_top3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results_top10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results_h2h ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Results are viewable by everyone, only admins can modify
CREATE POLICY "Results top3 viewable by everyone" ON race_results_top3 FOR SELECT USING (true);
CREATE POLICY "Only admins can manage results top3" ON race_results_top3 FOR INSERT
    WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can update results top3" ON race_results_top3 FOR UPDATE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can delete results top3" ON race_results_top3 FOR DELETE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Results top10 viewable by everyone" ON race_results_top10 FOR SELECT USING (true);
CREATE POLICY "Only admins can manage results top10" ON race_results_top10 FOR INSERT
    WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can update results top10" ON race_results_top10 FOR UPDATE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can delete results top10" ON race_results_top10 FOR DELETE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Results h2h viewable by everyone" ON race_results_h2h FOR SELECT USING (true);
CREATE POLICY "Only admins can manage results h2h" ON race_results_h2h FOR INSERT
    WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can update results h2h" ON race_results_h2h FOR UPDATE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can delete results h2h" ON race_results_h2h FOR DELETE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Scores: Everyone can read all scores (needed for standings), only admins can manage
CREATE POLICY "Scores viewable by everyone" ON scores FOR SELECT USING (true);
CREATE POLICY "Only admins can manage scores" ON scores FOR INSERT
    WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can update scores" ON scores FOR UPDATE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Only admins can delete scores" ON scores FOR DELETE
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Also allow predictions to be read by admins (needed for score calculation)
CREATE POLICY "Admins can view all predictions" ON predictions FOR SELECT
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can view all top3 predictions" ON prediction_top3 FOR SELECT
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can view all top10 predictions" ON prediction_top10 FOR SELECT
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can view all h2h predictions" ON prediction_h2h FOR SELECT
    USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));
