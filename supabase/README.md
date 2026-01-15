# Supabase Migration Instructions

## Setup

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Run the migration

## Tables Created

- `reddit_analyses`: Stores analysis results with user_id
- `blueprints`: Optional table for tracking blueprints separately
- `scan_logs`: Stores metrics for each scan

## Row Level Security (RLS)

All tables have RLS enabled with policies that ensure users can only access their own data.

## Verification

After running the migration, verify that:
1. All tables are created
2. RLS is enabled on all tables
3. Policies are created correctly
