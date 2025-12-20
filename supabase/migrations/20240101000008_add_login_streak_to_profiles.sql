-- Add login streak columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- Add comments
COMMENT ON COLUMN public.profiles.login_streak IS 'Number of consecutive days the user has logged in';
COMMENT ON COLUMN public.profiles.last_login_date IS 'Date of the user''s last login (used to calculate streak)';
