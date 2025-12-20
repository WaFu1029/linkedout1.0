-- Add garden columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS garden_grid JSONB DEFAULT '[[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null]]'::jsonb,
ADD COLUMN IF NOT EXISTS garden_points INTEGER DEFAULT 100;

-- Add comment to explain the structure
COMMENT ON COLUMN public.profiles.garden_grid IS '6x8 grid array representing the emoji garden. Each cell can be null or an emoji string.';
COMMENT ON COLUMN public.profiles.garden_points IS 'Points available for purchasing vegetables in the garden shop.';
