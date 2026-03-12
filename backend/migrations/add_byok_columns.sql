-- Migration: Add BYOK (Bring Your Own Key) columns to users table
-- Run once on your Railway PostgreSQL database

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS byok_openrouter_key VARCHAR(256),
  ADD COLUMN IF NOT EXISTS byok_enabled BOOLEAN NOT NULL DEFAULT FALSE;
