-- Add gifts_received column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gifts_received INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.profiles.gifts_received IS 'Number of vegetables received as gifts from connected users.';
