-- Add missing ticket status values to the enum
-- This migration adds 'checked_in', 'checked_out', and 'unpaid' statuses

-- First, add the new values to the enum
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'checked_in';
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'checked_out';
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'unpaid';

-- Note: 'unpaid' was added in migration 0001_add_unpaid_ticket_status.sql
-- This migration ensures all statuses are present
