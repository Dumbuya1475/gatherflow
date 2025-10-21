-- Add 'unpaid' to the ticket_status enum
-- IMPORTANT: This command must be run inside a transaction.
-- If you are running this in the Supabase SQL Editor, it is already in a transaction.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unpaid' AND enumtypid = 'ticket_status'::regtype) THEN
        ALTER TYPE public.ticket_status ADD VALUE 'unpaid' AFTER 'expired';
    END IF;
END
$$;
