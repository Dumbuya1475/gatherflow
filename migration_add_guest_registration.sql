-- This SQL script updates the 'profiles' table to allow for guest users
-- who are not registered in the 'auth.users' table.

-- Step 1: Add the 'is_guest' column to the 'profiles' table.
-- This column will be used to identify guest profiles.
ALTER TABLE public.profiles
ADD COLUMN is_guest BOOLEAN DEFAULT FALSE;

-- Step 2: Remove the foreign key constraint on the 'id' column.
-- This is necessary to allow profiles to exist without a corresponding user in 'auth.users'.
-- Note: The constraint name 'profiles_id_fkey' is a common default, but it might be different in your database.
ALTER TABLE public.profiles
DROP CONSTRAINT profiles_id_fkey;

-- Step 3: Ensure the 'id' column is a primary key and generates a UUID for new profiles.
-- This is for guest profiles, as registered users will get their id from auth.users.
ALTER TABLE public.profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid();
