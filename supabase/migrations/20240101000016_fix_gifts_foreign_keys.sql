-- Fix gifts table foreign keys to reference auth.users instead of profiles
-- This allows gifts to be created even if profiles don't exist yet

-- Drop existing foreign key constraints
ALTER TABLE public.gifts
DROP CONSTRAINT IF EXISTS gifts_gifter_id_fkey;

ALTER TABLE public.gifts
DROP CONSTRAINT IF EXISTS gifts_recipient_id_fkey;

-- Recreate foreign keys to reference auth.users directly
ALTER TABLE public.gifts
ADD CONSTRAINT gifts_gifter_id_fkey
FOREIGN KEY (gifter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.gifts
ADD CONSTRAINT gifts_recipient_id_fkey
FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

