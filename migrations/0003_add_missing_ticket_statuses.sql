-- Add missing ticket status value 'unpaid' to the enum
-- Note: checked_in and checked_out are boolean columns, NOT status enum values

-- Add 'unpaid' status if it doesn't exist
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'unpaid';

-- Clarification:
-- status column: 'pending', 'approved', 'rejected', 'expired', 'unpaid'
-- checked_in column: boolean (true/false)
-- checked_out column: boolean (true/false)
