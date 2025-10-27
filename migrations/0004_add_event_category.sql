-- Add category column to events table
ALTER TABLE public.events 
ADD COLUMN category text DEFAULT 'other' CHECK (category IN ('conference', 'workshop', 'festival', 'concert', 'seminar', 'networking', 'sports', 'community', 'other'));

-- Update existing events to have a default category
UPDATE public.events 
SET category = 'other' 
WHERE category IS NULL;
