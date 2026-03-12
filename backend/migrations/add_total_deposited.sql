-- Migration: add total_deposited_usd column for VIP pricing
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS total_deposited_usd NUMERIC(12, 2) NOT NULL DEFAULT 0;
