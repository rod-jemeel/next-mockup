-- Migration: Add tax tracking fields to expenses
-- Date: 2026-01-18
-- Description: Adds tax amount tracking for expense records

-- Add tax fields to expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS amount_pre_tax DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS effective_tax_rate DECIMAL(5,4);

-- Backfill existing expenses (assume current amount is total, tax = 0)
-- This treats existing amounts as pre-tax amounts
UPDATE expenses SET
  amount_pre_tax = amount,
  tax_amount = 0,
  effective_tax_rate = 0
WHERE amount_pre_tax IS NULL;

-- Make amount_pre_tax NOT NULL after backfill
ALTER TABLE expenses ALTER COLUMN amount_pre_tax SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN expenses.amount_pre_tax IS 'Pre-tax amount of the expense';
COMMENT ON COLUMN expenses.tax_amount IS 'Tax amount applied to the expense';
COMMENT ON COLUMN expenses.effective_tax_rate IS 'Effective tax rate (tax_amount / amount_pre_tax)';

-- Note: The existing 'amount' column becomes the total amount (pre_tax + tax)
-- We'll update it in the application layer when creating/updating expenses
