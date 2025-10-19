-- This SQL script updates the Row Level Security (RLS) policies for the 'events' table.

-- First, we remove the old, less specific policy for creating events.
DROP POLICY "Organizers can insert events." ON public.events;

-- Then, we create a new, more secure policy.
CREATE POLICY "Registered users can create events."
ON public.events
FOR INSERT
WITH CHECK (
  -- This check ensures that the person creating the event exists in the 'profiles' table
  -- and is NOT a guest user.
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_guest = false
  )
  -- This check ensures the organizer_id of the new event matches the creator's user id.
  AND auth.uid() = organizer_id
);
