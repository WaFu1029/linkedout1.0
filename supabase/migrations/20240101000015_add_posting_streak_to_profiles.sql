-- Add posting streak columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS posting_streak INTEGER DEFAULT 0;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_post_date DATE;

-- Add comments
COMMENT ON COLUMN public.profiles.posting_streak IS 'Number of consecutive days the user has posted';
COMMENT ON COLUMN public.profiles.last_post_date IS 'Date of the user''s last post (used to calculate streak)';
