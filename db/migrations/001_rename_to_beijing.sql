-- Migration: Rename date_tokyo to date_beijing in daily_index table
-- Run this manually if you have existing data

-- Step 1: Rename the column
ALTER TABLE daily_index 
RENAME COLUMN date_tokyo TO date_beijing;

-- Step 2: (Optional) If you need to recreate the table from scratch:
-- DROP TABLE IF EXISTS daily_index;
-- CREATE TABLE daily_index (
--   date_beijing DATE PRIMARY KEY,
--   tweet_count INTEGER NOT NULL DEFAULT 0,
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

