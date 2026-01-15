-- Create reddit_analyses table
CREATE TABLE IF NOT EXISTS reddit_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    niche TEXT NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_posts INTEGER NOT NULL,
    pains JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create blueprints table (optional, for tracking)
CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES reddit_analyses(id) ON DELETE CASCADE,
    pain_point_id TEXT NOT NULL,
    solution_name TEXT,
    market_size TEXT,
    mrr_estimate TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scan_logs table (for metrics)
CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    niche TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    posts_found INTEGER NOT NULL,
    pains_generated INTEGER NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reddit_analyses_user_id ON reddit_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_reddit_analyses_created_at ON reddit_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_scan_logs_user_id ON scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created_at ON scan_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_blueprints_analysis_id ON blueprints(analysis_id);

-- Enable Row Level Security (RLS)
ALTER TABLE reddit_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reddit_analyses
CREATE POLICY "Users can view their own analyses"
    ON reddit_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
    ON reddit_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
    ON reddit_analyses FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for blueprints
CREATE POLICY "Users can view blueprints from their analyses"
    ON blueprints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM reddit_analyses
            WHERE reddit_analyses.id = blueprints.analysis_id
            AND reddit_analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert blueprints for their analyses"
    ON blueprints FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM reddit_analyses
            WHERE reddit_analyses.id = blueprints.analysis_id
            AND reddit_analyses.user_id = auth.uid()
        )
    );

-- RLS Policies for scan_logs
CREATE POLICY "Users can view their own scan logs"
    ON scan_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan logs"
    ON scan_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
